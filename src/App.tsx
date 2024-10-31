// App.tsx

import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, Space, Drawer } from 'antd';
import { DownOutlined, PlusOutlined, SaveOutlined, PlayCircleOutlined, MenuOutlined } from '@ant-design/icons';
import LogicEditorContent from './components/LogicEditor/LogicEditorContent';

import Tabs from './components/Tabs/Tabs';

import {
  saveProjectData,
  loadProjectData,
  saveSceneData,
  loadSceneData,
  updateOpenedScenes,
  loadOpenedScenes,
} from './utils/storageUtils';
import SceneEditor from './components/SceneEditor/SceneEditor';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [sceneTabs, setSceneTabs] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState<string>('');
  const [editorTabs, setEditorTabs] = useState<{ [key: string]: string }>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerPlacement, setDrawerPlacement] = useState<'left' | 'right' | 'top' | 'bottom'>('left');

  // Инициализация проекта при загрузке
  useEffect(() => {
    const projectData = loadProjectData();
    const openScenes = loadOpenedScenes();

    if (projectData && projectData.scenes.length > 0) {
      setSceneTabs(projectData.scenes);
    }

    if (openScenes.length > 0) {
      setActiveScene(openScenes[0]?.key || '');
      const editorStates: { [key: string]: string } = {};
      openScenes.forEach((scene) => {
        editorStates[scene.key] = scene.state;
      });
      setEditorTabs(editorStates);
    } else if (projectData && projectData.scenes.length > 0) {
      // Если есть сохраненные сцены, но нет открытых сцен, открываем первую сцену
      setActiveScene(projectData.scenes[0]);
      updateOpenedScenes([
        {
          title: projectData.scenes[0],
          key: projectData.scenes[0],
          state: 'levelEditor',
        },
      ]);
    } else {
      // Если нет сохраненных сцен, создаем новую
      handleNewScene();
    }
  }, []);

  // Открытие и закрытие выезжающего меню
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleNewScene = () => {
    // Создание новой сцены
    const newScene = `Сцена ${sceneTabs.length + 1}`;
    const newSceneData = { sceneName: newScene, objects: [], settings: {} };

    // Добавляем новую сцену в `sceneTabs`
    const updatedSceneTabs = [...sceneTabs, newScene];
    setSceneTabs(updatedSceneTabs);
    setActiveScene(newScene);
    setEditorTabs((prevTabs) => ({ ...prevTabs, [newScene]: 'levelEditor' }));

    // Сохранение данных новой сцены
    saveSceneData(newScene, newSceneData);

    // Обновление `projectData` с новой сценой
    const projectData = loadProjectData() || { scenes: [] };
    projectData.scenes = updatedSceneTabs;
    saveProjectData(projectData);

    // Обновляем список открытых сцен и сохраняем его
    const openedScenes = loadOpenedScenes();
    const updatedOpenScenes = [
      ...openedScenes,
      {
        title: newScene,
        key: newScene,
        state: 'levelEditor',
      },
    ];
    updateOpenedScenes(updatedOpenScenes);
  };

  const handleRemoveScene = (tab: string) => {
    // Удаляем сцену из открытых вкладок
    const updatedOpenScenes = loadOpenedScenes().filter((scene) => scene.key !== tab);
    updateOpenedScenes(updatedOpenScenes);

    // Обновляем состояние открытых вкладок
    if (activeScene === tab && updatedOpenScenes.length > 0) {
      setActiveScene(updatedOpenScenes[0].key);
    } else if (updatedOpenScenes.length === 0) {
      setActiveScene('');
    } else {
      setActiveScene(activeScene);
    }

    // Обновляем editorTabs
    setEditorTabs((prevTabs) => {
      const newTabs = { ...prevTabs };
      delete newTabs[tab];
      return newTabs;
    });
  };

  const handleSceneChange = (tab: string) => {
    setActiveScene(tab);

    // Проверяем, есть ли сцена в открытых вкладках, если нет, добавляем
    const openedScenes = loadOpenedScenes();
    if (!openedScenes.find((scene) => scene.key === tab)) {
      const updatedOpenScenes = [
        ...openedScenes,
        {
          title: tab,
          key: tab,
          state: editorTabs[tab] || 'levelEditor',
        },
      ];
      updateOpenedScenes(updatedOpenScenes);
    }
  };

  const handleEditorTabChange = (key: string) => {
    setEditorTabs((prevTabs) => ({ ...prevTabs, [activeScene]: key }));

    const openedScenes = loadOpenedScenes().map((scene) =>
      scene.key === activeScene ? { ...scene, state: key } : scene
    );
    updateOpenedScenes(openedScenes);
  };

  const handleSaveProject = () => {
    const projectData = loadProjectData() || { scenes: [] };
    projectData.scenes = sceneTabs;
    saveProjectData(projectData);
  };

  const projectMenuItems = [
    { label: 'Создать сцену', key: 'newScene', onClick: handleNewScene },
    { label: 'Сохранить проект', key: 'save', onClick: handleSaveProject },
  ];

  const editMenuItems = [
    { label: 'Отменить', key: 'undo' },
    { label: 'Повторить', key: 'redo' },
  ];

  const aboutMenuItems = [
    { label: 'Версия', key: 'version' },
    { label: 'Контакты', key: 'contact' },
  ];

  return (
    <Layout style={{ height: '100vh', background: '#1c1c1c' }}>
      {/* Верхний Header с меню и вкладками */}
      <Header style={{ background: '#1f1f1f', padding: '0 16px', display: 'flex', height: '60px' }}>
        <Dropdown menu={{ items: projectMenuItems }} trigger={['click']}>
          <Space>
            <Button type="text" style={{ color: 'white' }}>
              Проект
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Dropdown menu={{ items: editMenuItems }} trigger={['click']}>
          <Space>
            <Button type="text" style={{ color: 'white', marginLeft: '16px' }}>
              Правка
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Dropdown menu={{ items: aboutMenuItems }} trigger={['click']}>
          <Space>
            <Button type="text" style={{ color: 'white', marginLeft: '16px' }}>
              О программе
            </Button>
            <DownOutlined />
          </Space>
        </Dropdown>

        <Tabs
          tabs={loadOpenedScenes().map((scene) => scene.key)}
          activeTab={activeScene}
          onTabClick={handleSceneChange}
          onAddTab={handleNewScene}
          onRemoveTab={handleRemoveScene}
        />
      </Header>

      {/* Разделенный Header с управлением */}
      <Header
        style={{
          background: '#1f1f1f',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '48px',
        }}
      >
        <Button type="text" icon={<MenuOutlined />} onClick={toggleDrawer} style={{ color: 'white' }} />

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewScene}
            style={{ marginRight: '16px' }}
          >
            New Scene
          </Button>
          <Button
            type="default"
            icon={<SaveOutlined />}
            onClick={handleSaveProject}
            style={{ marginRight: '16px' }}
          >
            Save
          </Button>
          <Button type="primary" icon={<PlayCircleOutlined />}>
            Run Game
          </Button>
        </Space>

        <div style={{ width: '48px' }} />
      </Header>

      <Layout>
        <Content style={{ padding: '16px', background: '#2e2e2e' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Button
              type={editorTabs[activeScene] === 'levelEditor' ? 'primary' : 'default'}
              onClick={() => handleEditorTabChange('levelEditor')}
            >
              Редактор уровня
            </Button>
            <Button
              type={editorTabs[activeScene] === 'logicEditor' ? 'primary' : 'default'}
              onClick={() => handleEditorTabChange('logicEditor')}
            >
              Редактор логики
            </Button>
          </div>
          {editorTabs[activeScene] === 'levelEditor' ? (
            // <SceneEditorContent scene={activeScene} />
            <SceneEditor />
          ) : (
            <LogicEditorContent scene={activeScene} />
          )}
        </Content>
      </Layout>

      {/* Выезжающее меню для редактирования параметров */}
      <Drawer
        title="Параметры проекта"
        placement={drawerPlacement}
        onClose={toggleDrawer}
        open={drawerVisible}
      >
        <p>Здесь можно редактировать параметры проекта.</p>
      </Drawer>
    </Layout>
  );
};

export default App;
