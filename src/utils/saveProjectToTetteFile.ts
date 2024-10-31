import { ProjectData } from './projTypes';
const saveProjectToTetteFile = (project: ProjectData) => {
    const serializedData = JSON.stringify(project);
    const blob = new Blob([serializedData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${project.projectName}.tette`;
    link.click();
  };
export default saveProjectToTetteFile;