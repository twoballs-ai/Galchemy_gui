import { ProjectData } from './projTypes';
import JSZip from "jszip";

const exportProjectToZip = async (project: ProjectData) => {
  const zip = new JSZip();
  const projectFolder = zip.folder(project.projectName);
  
  // Добавление сцен в архив
  project.scenes.forEach((scene) => {
    const sceneFolder = projectFolder?.folder(`scenes/${scene.name}`);
    sceneFolder?.file("config.json", JSON.stringify(scene));
  });

  // Добавление ресурсов (картинок, звуков)
  Object.entries(project.resources).forEach(async ([resourceName, resourcePath]) => {
    const resourceData = await fetch(resourcePath).then(res => res.blob());
    projectFolder?.file(`resources/${resourceName}`, resourceData);
  });

  // Экспортирование как zip
  zip.generateAsync({ type: "blob" }).then((content) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${project.projectName}.zip`;
    link.click();
  });
};
export default exportProjectToZip;