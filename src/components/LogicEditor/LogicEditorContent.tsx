import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useEdgesState,
  useNodesState,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  OnSelectionChangeParams,
  OnNodeContextMenu,
  OnPaneContextMenu,
} from "reactflow";
import "reactflow/dist/style.css";
import { message } from "antd";

interface LogicEditorContentProps {
  projectName: string;
  sceneName: string;
}

// Тип для состояния контекстного меню
type ContextMenuInfo = {
  x: number;
  y: number;
  nodeId?: string;    // если нажали на ноду, здесь её id
};

const LogicEditorContent: React.FC<LogicEditorContentProps> = ({
  projectName,
  sceneName,
}) => {
  // ------------------------
  // 1. Изначальные узлы (start/end)
  // ------------------------
  const initialNodes: Node[] = [
    {
      id: "start",
      type: "input",
      data: { label: "Начало уровня" },
      position: { x: 50, y: 200 },
      // Зададим базовый стиль + зелёную рамку
      style: { border: "2px solid green", padding: 10 },
      sourcePosition: "right",
      draggable: true,
    },
    {
      id: "end",
      type: "output",
      data: { label: "Конец уровня" },
      position: { x: 400, y: 200 },
      // Зададим базовый стиль + красную рамку
      style: { border: "2px solid red", padding: 10 },
      targetPosition: "left",
      draggable: true,
    },
  ];

  // ------------------------
  // 2. Изначальные рёбра
  // ------------------------
  const initialEdges: Edge[] = [];

  // ------------------------
  // 3. Состояния React Flow
  // ------------------------
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  // Храним выбранные узлы, чтобы показывать, какие ноды выделены
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  // ------------------------
  // 4. Состояние для контекстного меню
  // ------------------------
  const [contextMenu, setContextMenu] = useState<ContextMenuInfo | null>(null);

  // ------------------------
  // 5. Обработчик изменений узлов
  //    - Не позволяет удалить "start" и "end"
  //    - Меняем стиль рамки, если узел выбран
  // ------------------------
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((currentNodes) => {
        let updatedNodes = applyNodeChanges(changes, currentNodes);

        // Если кто-то попытался удалить "start" или "end", вернём их обратно
        const startNode = currentNodes.find((n) => n.id === "start");
        const endNode = currentNodes.find((n) => n.id === "end");

        if (!updatedNodes.find((n) => n.id === "start") && startNode) {
          updatedNodes = [...updatedNodes, startNode];
        }
        if (!updatedNodes.find((n) => n.id === "end") && endNode) {
          updatedNodes = [...updatedNodes, endNode];
        }

        // Изменим стиль, если узел выбран
        updatedNodes = updatedNodes.map((node) => {
          // Проверяем, выбран ли этот узел
          const isSelected = node.selected ?? false;

          // Для start/end оставим цвет, но если узел выделен — сделаем рамку толще
          if (node.id === "start") {
            return {
              ...node,
              style: {
                ...node.style,
                border: isSelected ? "4px solid green" : "2px solid green",
              },
            };
          }
          if (node.id === "end") {
            return {
              ...node,
              style: {
                ...node.style,
                border: isSelected ? "4px solid red" : "2px solid red",
              },
            };
          }

          // Для остальных нод при выделении делаем, скажем, синюю рамку
          return {
            ...node,
            style: {
              ...node.style,
              border: isSelected ? "4px solid blue" : "2px solid #ccc",
            },
          };
        });

        return updatedNodes;
      });
    },
    [setNodes]
  );

  // ------------------------
  // 6. Обработчик изменений рёбер
  // ------------------------
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
    },
    [setEdges]
  );

  // ------------------------
  // 7. Обработчик соединений
  //    - Разрешаем соединять любые узлы, кроме:
  //      - «Из end» и «в start»
  // ------------------------
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === "end") {
        message.error("Невозможно создать связь из 'Конец уровня'.");
        return;
      }
      if (params.target === "start") {
        message.error("Невозможно создать связь к 'Начало уровня'.");
        return;
      }
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  // ------------------------
  // 8. Сохранение и загрузка
  // ------------------------
  const saveLogic = () => {
    const logicData = { nodes, edges };
    localStorage.setItem(
      `${projectName}-${sceneName}-logic`,
      JSON.stringify(logicData)
    );
    message.success("Логика успешно сохранена!");
  };

  const loadLogic = useCallback(() => {
    const savedData = localStorage.getItem(`${projectName}-${sceneName}-logic`);
    if (savedData) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedData);
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
      } catch (error) {
        message.error("Не удалось загрузить логику!");
      }
    }
  }, [projectName, sceneName, setNodes, setEdges]);

  useEffect(() => {
    loadLogic();
  }, [loadLogic]);

  // ------------------------
  // 9. Добавление нового узла
  // ------------------------
  const addNode = () => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      data: { label: "Новый узел" },
      position: { x: 200, y: 50 },
      style: { border: "2px solid #ccc", padding: 10 },
      draggable: true,
      sourcePosition: "right",
      targetPosition: "left",
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // ------------------------
  // 10. Удаление выбранных узлов (кроме start/end)
  // ------------------------
  const removeSelectedNodes = () => {
    if (!selectedNodes.length) return;

    const updatedNodes = nodes.filter((node) => {
      // Если это start/end — не удаляем
      if (node.id === "start" || node.id === "end") {
        return true;
      }
      // Если узел в списке выбранных — удаляем его
      return !selectedNodes.find((sn) => sn.id === node.id);
    });

    // Удаляем рёбра, связанные с этими узлами
    const updatedEdges = edges.filter((edge) => {
      return !selectedNodes.find(
        (sn) => sn.id === edge.source || sn.id === edge.target
      );
    });

    setNodes(updatedNodes);
    setEdges(updatedEdges);

    message.success("Выбранные узлы удалены (кроме ключевых).");
  };

  // ------------------------
  // 11. Отслеживание выбранных узлов
  //     - Сохраняем в state, чтобы кнопка удаления знала, что удалять
  // ------------------------
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedNodes(params.nodes);
  }, []);

  // ------------------------
  // 12. Контекстное меню (правая кнопка)
  //     - Для ноды: onNodeContextMenu
  //     - Для пустого пространства: onPaneContextMenu
  // ------------------------
  const onNodeContextMenu: OnNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      // Открываем меню для конкретной ноды
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  const onPaneContextMenu: OnPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    // Открываем меню без nodeId (значит, клик по пустому месту)
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: undefined,
    });
  }, []);

  // Закрыть меню
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Пример действия из контекстного меню — просто сообщение
  const handleContextAction = (msg: string) => {
    message.info(msg);
    closeContextMenu();
  };

  // ------------------------
  // 13. Интерфейс
  // ------------------------
  return (
    <div style={{ width: "100%", height: "100%", background: "#1f1f1f" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        style={{ background: "#2e2e2e" }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>

      {/* Панель управления (Добавить / Удалить / Сохранить / Загрузить) */}
      <div
        style={{
          position: "absolute",
          top: 150,
          right: 10,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={addNode}
          style={{
            background: "#444",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Добавить узел
        </button>
        <button
          onClick={removeSelectedNodes}
          style={{
            background: "#666",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Удалить выбранные узлы
        </button>
        <button
          onClick={saveLogic}
          style={{
            background: "green",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Сохранить
        </button>
        <button
          onClick={loadLogic}
          style={{
            background: "blue",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Загрузить
        </button>
      </div>

      {/** Контекстное меню */}
      {contextMenu && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            minWidth: 120,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            zIndex: 9999,
            padding: "8px",
          }}
          onMouseLeave={closeContextMenu}
        >
          {contextMenu.nodeId ? (
            <>
              <div style={{ marginBottom: 4, fontWeight: "bold" }}>
                Нода: {contextMenu.nodeId}
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => handleContextAction("Действие для ноды")}
              >
                Действие для ноды
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => handleContextAction("Ещё одно действие")}
              >
                Ещё одно действие
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 4, fontWeight: "bold" }}>
                Холст (пустое место)
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={addNode}
              >
                Добавить ноду
              </div>
              <div
                style={{ cursor: "pointer" }}
                onClick={() => handleContextAction("Действие 2")}
              >
                Действие 2
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LogicEditorContent;
