"""Lightweight embedding engine using HuggingFace transformers.

Embedding models are BERT-based and cannot be loaded by mlx_lm.
This engine uses transformers + torch directly, running in the
API process without going through the runner/worker pipeline.
Embedding models are small (50-400MB) and fast (single forward pass).
"""

import asyncio
import base64
import logging
import struct
from typing import Any

import torch
from transformers import AutoModel, AutoTokenizer  # type: ignore[import-untyped]

logger = logging.getLogger("exo.api.embedding_engine")

DEFAULT_EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingEngine:
    """Manages embedding model loading and inference."""

    def __init__(self) -> None:
        self._models: dict[str, tuple[Any, Any]] = {}

    async def embed(
        self,
        model_id: str,
        texts: list[str],
        encoding_format: str = "float",
    ) -> tuple[list[list[float] | str], int]:
        """Generate embeddings for a list of texts.

        Args:
            model_id: HuggingFace model ID for the embedding model.
            texts: List of strings to embed.
            encoding_format: "float" for list of floats, "base64" for base64-encoded.

        Returns:
            Tuple of (embeddings list, total token count).
        """
        if model_id not in self._models:
            await self._load(model_id)

        model, tokenizer = self._models[model_id]
        embeddings, token_count = await asyncio.to_thread(
            self._forward, model, tokenizer, texts
        )

        if encoding_format == "base64":
            embeddings = [self._to_base64(emb) for emb in embeddings]

        return embeddings, token_count

    async def _load(self, model_id: str) -> None:
        """Load an embedding model from HuggingFace."""
        logger.info(f"EmbeddingEngine: loading {model_id}...")

        def _do_load() -> tuple[Any, Any]:
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = AutoModel.from_pretrained(model_id, trust_remote_code=False)
            model.eval()
            return model, tokenizer

        model, tokenizer = await asyncio.to_thread(_do_load)
        self._models[model_id] = (model, tokenizer)
        logger.info(f"EmbeddingEngine: {model_id} loaded")

    @staticmethod
    def _forward(
        model: Any, tokenizer: Any, texts: list[str]
    ) -> tuple[list[list[float]], int]:
        """Run embedding forward pass (called in thread)."""
        inputs = tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        )
        token_count = int(inputs["attention_mask"].sum().item())

        with torch.no_grad():
            outputs = model(**inputs)

        # Mean pooling over non-padding tokens
        attention_mask = inputs["attention_mask"].unsqueeze(-1)
        hidden_states = outputs.last_hidden_state
        summed = (hidden_states * attention_mask).sum(dim=1)
        counts = attention_mask.sum(dim=1).clamp(min=1)
        embeddings = summed / counts

        # L2 normalize
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)

        return embeddings.tolist(), token_count

    @staticmethod
    def _to_base64(embedding: list[float]) -> str:
        """Convert a float list to base64-encoded little-endian floats."""
        return base64.b64encode(
            struct.pack(f"<{len(embedding)}f", *embedding)
        ).decode("ascii")
