import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatForm } from './ChatForm';

const meta: Meta<typeof ChatForm> = {
  title: 'Chat/ChatForm',
  component: ChatForm,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 600, padding: 24, background: '#000' }}><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof ChatForm>;

export const Default: Story = {
  args: {
    onSend: (msg, files) => console.log('Send:', msg, files),
    placeholder: 'Ask anything…',
  },
};

export const WithModelHeader: Story = {
  args: {
    onSend: () => {},
    modelLabel: 'Qwen3-30B-A3B-4bit',
    onOpenModelPicker: () => alert('Open picker'),
    showThinkingToggle: true,
    thinkingEnabled: false,
    onToggleThinking: () => {},
    ttftMs: 245,
    tps: 42.3,
  },
};

export const Loading: Story = {
  args: {
    onSend: () => {},
    isLoading: true,
    onCancel: () => alert('Cancelled'),
    modelLabel: 'Llama-3.1-8B-4bit',
    tps: 38.1,
  },
};

export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [thinking, setThinking] = useState(false);
    return (
      <ChatForm
        onSend={(msg) => {
          console.log('Sent:', msg);
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
        onCancel={() => setLoading(false)}
        isLoading={loading}
        modelLabel="Qwen3-30B-A3B"
        showThinkingToggle
        thinkingEnabled={thinking}
        onToggleThinking={() => setThinking(!thinking)}
      />
    );
  },
};
