import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, Space, Drawer } from 'antd';
import {
  DownOutlined,
  PlusOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import LogicEditorContent from './components/LogicEditor/LogicEditorContent';
import SceneEditor from './components/SceneEditor/SceneEditor';
import Tabs from './components/Tabs/Tabs';
import {
  saveProjectData,
  loadProjectData,
  saveSceneData,
  loadSceneData,
  updateOpenedScenes,
  loadOpenedScenes,
} from './utils/storageUtils';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [sceneTabs, setSceneTabs] = useState<string[]>([]);
  const [activeScene, setActiveScene] = useState<string>('');
  const [editorTabs, setEditorTabs] = useState<{ [key: string]: string }>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerPlacement, setDrawerPlacement] = useState<'left' | 'right' | 'top' | 'bottom'>('left');

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
      setActiveScene(projectData.scenes[0]);
      updateOpenedScenes([
        {
          title: projectData.scenes[0],
          key: projectData.scenes[0],
          state: 'levelEditor',
        },
      ]);
    } else {
      handleNewScene();
    }
  }, []);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  const handleNewScene = () => {
    const newScene = `Scene ${sceneTabs.length + 1}`;
    const newSceneData = { sceneName: newScene, objects: [], settings: {} };

    const updatedSceneTabs = [...sceneTabs, newScene];
    setSceneTabs(updatedSceneTabs);
    setActiveScene(newScene);
    setEditorTabs((prevTabs) => ({ ...prevTabs, [newScene]: 'levelEditor' }));

    saveSceneData(newScene, newSceneData);
    const projectData = loadProjectData() || { scenes: [] };
    projectData.scenes = updatedSceneTabs;
    saveProjectData(projectData);

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
    const updatedOpenScenes = loadOpenedScenes().filter((scene) => scene.key !== tab);
    updateOpenedScenes(updatedOpenScenes);

    if (activeScene === tab && updatedOpenScenes.length > 0) {
      setActiveScene(updatedOpenScenes[0].key);
    } else if (updatedOpenScenes.length === 0) {
      setActiveScene('');
    } else {
      setActiveScene(activeScene);
    }

    setEditorTabs((prevTabs) => {
      const newTabs = { ...prevTabs };
      delete newTabs[tab];
      return newTabs;
    });
  };

  const handleSceneChange = (tab: string) => {
    setActiveScene(tab);
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
          tabs={sceneTabs}
          activeTab={activeScene}
          onTabClick={handleSceneChange}
          onAddTab={handleNewScene}
          onRemoveTab={handleRemoveScene}
        />
      </Header>

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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNewScene} style={{ marginRight: '16px' }}>
            New Scene
          </Button>
          <Button type="default" icon={<SaveOutlined />} onClick={handleSaveProject} style={{ marginRight: '16px' }}>
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
             <SceneEditor activeScene={activeScene} />
          ) : (
            <LogicEditorContent scene={activeScene} />
          )}
        </Content>
      </Layout>

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
