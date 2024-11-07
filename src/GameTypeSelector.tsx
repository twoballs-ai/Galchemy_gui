import React from 'react';
import { Button, Space, Typography } from 'antd';

interface GameTypeSelectorProps {
  onSelect: (gameType: string) => void;
}

const GameTypeSelector: React.FC<GameTypeSelectorProps> = ({ onSelect }) => (
  <div style={{ textAlign: 'center', padding: '24px' }}>
    <Typography.Title level={3}>Выберите тип рендеринга</Typography.Title>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Button type="primary" onClick={() => onSelect('2d')}>
        Canvas 2D
      </Button>
      <Button type="primary" onClick={() => onSelect('webgl2d')}>
        WebGL 2D
      </Button>
      <Button type="primary" onClick={() => onSelect('webgl3d')}>
        WebGL 3D
      </Button>
    </Space>
  </div>
);

export default GameTypeSelector;
