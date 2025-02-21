import React, { useEffect } from 'react';
import { Drawer, Form, Input, Button, Space } from 'antd';
import { ProjectSummary } from '../utils/storageUtils';

interface ProjectSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  project: ProjectSummary;
  onUpdateProject: (updatedProject: ProjectSummary) => void;
}

const ProjectSettingsDrawer: React.FC<ProjectSettingsDrawerProps> = ({
  visible,
  onClose,
  project,
  onUpdateProject,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      projectName: project.name,
      // Дополнительно: можно добавить другие поля, например, renderType или список ресурсов
    });
  }, [project, form]);

  const onFinish = (values: any) => {
    const updatedProject: ProjectSummary = { ...project, name: values.projectName };
    onUpdateProject(updatedProject);
    onClose();
  };

  return (
    <Drawer
      title="Параметры проекта"
      placement="left"
      onClose={onClose}
      open={visible}
      width={300}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Название проекта"
          name="projectName"
          rules={[{ required: true, message: 'Введите название проекта' }]}
        >
          <Input />
        </Form.Item>
        {/* Можно добавить другие поля, например, список ресурсов */}
        <Form.Item label="Ресурсы проекта" name="resources">
          <Input.TextArea rows={4} placeholder="Введите список ресурсов или другую информацию" />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            Сохранить
          </Button>
          <Button onClick={onClose}>
            Отмена
          </Button>
        </Space>
      </Form>
    </Drawer>
  );
};

export default ProjectSettingsDrawer;
