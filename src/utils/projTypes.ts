// src/types.ts

export type SceneConfig = {
    id: string;
    name: string;
    settings: any;
    objects: any[];
    logic: string;
    resources: { [key: string]: string };
  };
  
  export type ProjectData = {
    projectName: string;
    version: string;
    scenes: SceneConfig[];
    resources: { [key: string]: string };
  };
  