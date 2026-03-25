import type { Meta, StoryObj } from '@storybook/react-vite';
import { FamilyLogos } from './FamilyLogos';

const ALL_FAMILIES = [
  'favorites', 'recents', 'llama', 'qwen', 'deepseek', 'openai',
  'glm', 'minimax', 'kimi', 'flux', 'qwen-image', 'huggingface',
  'step', 'unknown-family',
];

const meta: Meta<typeof FamilyLogos> = {
  title: 'Models/FamilyLogos',
  component: FamilyLogos,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof FamilyLogos>;

export const AllFamilies: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: 20, background: '#000' }}>
      {ALL_FAMILIES.map((f) => (
        <div key={f} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <FamilyLogos family={f} className="" />
          <span style={{ color: '#999', fontSize: 10 }}>{f}</span>
        </div>
      ))}
    </div>
  ),
};
