import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FamilySidebar } from './FamilySidebar';

const meta: Meta<typeof FamilySidebar> = {
  title: 'Models/FamilySidebar',
  component: FamilySidebar,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ height: 500, background: '#111', border: '1px solid #222', borderRadius: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FamilySidebar>;

const families = ['llama', 'qwen', 'deepseek', 'glm', 'minimax', 'kimi', 'flux', 'step'];

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <FamilySidebar
        families={families}
        selectedFamily={selected}
        hasFavorites={true}
        hasRecents={true}
        onSelect={setSelected}
      />
    );
  },
};

export const NoFavoritesOrRecents: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <FamilySidebar
        families={families}
        selectedFamily={selected}
        hasFavorites={false}
        hasRecents={false}
        onSelect={setSelected}
      />
    );
  },
};
