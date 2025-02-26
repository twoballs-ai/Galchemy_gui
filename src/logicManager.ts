// Пример структуры узлов логики
// В дальнейшем вы сможете описать структуру node-based графа
export interface LogicGraph {
  nodes: any[];
  connections: any[];
  // ... любые поля для хранения графа
}

// Класс глобального менеджера логики
export class GlobalLogicManager {
  // key: sceneName, value: LogicGraph
  private logicStore: Record<string, LogicGraph> = {};

  // Сохраняем граф логики для конкретной сцены
  setGraph(sceneName: string, graph: LogicGraph) {
    this.logicStore[sceneName] = graph;
  }

  getGraph(sceneName: string): LogicGraph | null {
    return this.logicStore[sceneName] || null;
  }

  /**
   * Запуск логики для сцены.
   * Вариант A: вызывается один раз при старте сцены (или при нажатии "Run Game").
   */
  runLogicForScene(sceneName: string, coreInstance: any) {
    const graph = this.getGraph(sceneName);
    if (!graph) {
      //console.log(`Нет логики для сцены "${sceneName}"`);
      return;
    }
    //console.log(`Запуск логики для сцены "${sceneName}".`, graph);

    // Здесь вы разбираете graph и делаете нужные действия:
    // 1) Ищете узел "OnSceneStart"
    // 2) Выполняете переходы
    // 3) Если узел — "MoveObject", вызываете coreInstance / sceneManager и т.д.

    // Ниже — просто пример псевдо-обработки:
    graph.nodes.forEach((node) => {
      if (node.type === "OnSceneStart") {
        // Выполнить действия или перейти к следующему узлу
      } else if (node.type === "MoveObject") {
        // Пример: node.params = { objectId, x, y }
        // sceneManager.moveObject(objectId, x, y)
      }
      // И т.д.
    });
  }
}

// Создаём единственный экземпляр менеджера
export const globalLogicManager = new GlobalLogicManager();
