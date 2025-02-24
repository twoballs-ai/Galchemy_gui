import React from 'react';
import { List, Button, Typography } from 'antd';

interface GameTypeSelectorProps {
  onSelect: (gameType: string) => void;
}

const GameTypeSelector: React.FC<GameTypeSelectorProps> = ({ onSelect }) => {
  const gameTypes = [
    {
      key: '2d',
      title: '2D Игра Canvas 2D(WebGL 2D)',
      description:
        'Игра с использованием Canvas 2D(WebGL 2D). Позволяет создавать простые игры с 2D-графикой, используя примитивы (квадраты, круги) и спрайты. Идеально подходит для нетребовательных игр и простых проектов.',
    },
    // {
    //   key: 'webgl2d',
    //   title: '2D Игра (WebGL 2D)',
    //   description:
    //     'Игра с использованием WebGL 2D. Использует координаты X и Y для отрисовки спрайтов. Подходит для создания более сложных 2D-игр, требующих высокой производительности, но без поддержки 3D-объектов.',
    // },
    // {
    //   key: 'webgl3d',
    //   title: '3D Игра (WebGL 3D)',
    //   description:
    //     'Игра с использованием WebGL 3D. Позволяет создавать игры с полным 3D-рендерингом, используя трёхмерные модели и анимации. Идеально для сложных проектов и игр с полным 3D-миром.',
    // },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Typography.Title level={4}>Выберите тип игры</Typography.Title>
      <List
        bordered
        dataSource={gameTypes}
        renderItem={(item) => (
          <List.Item>
            <div style={{ flex: 1 }}>
              <Typography.Title level={5}>{item.title}</Typography.Title>
              <Typography.Text>{item.description}</Typography.Text>
            </div>
            <Button type="primary" onClick={() => onSelect(item.key)}>
              Выбрать
            </Button>
          </List.Item>
        )}
      />
    </div>
  );
};

export default GameTypeSelector;
