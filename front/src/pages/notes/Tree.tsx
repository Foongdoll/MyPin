import { useMemo, useState } from "react";
import type { Folder } from "../../shared/types/NoteType";

const cx = (...cls: (string | false | undefined)[]) => cls.filter(Boolean).join(" ");

export function TreeNode({
  node,
  depth = 0,
  activePath,
  onSelect,
}: {
  node: Folder;
  depth?: number;
  activePath: string[];
  onSelect: (path: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children?.length;
  const path = useMemo(() => {
    // 부모 이름들을 depth 만큼 추정하기보단, 표시용으로만 현재 노드 이름을 activePath와 비교
    return [node.name];
  }, [node.name]);

  const isActive = activePath[activePath.length - 1] === node.name;

  return (
    <div className="select-none">
      <button
        className={cx(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100",
          isActive && "bg-blue-50 ring-1 ring-inset ring-blue-200"
        )}
        onClick={() => {
          onSelect([node.name]);
          if (hasChildren) setOpen((s) => !s);
        }}
        title={node.name}
      >
        {hasChildren ? (
          <svg
            className={cx(
              "h-4 w-4 transition-transform",
              open ? "rotate-90" : "rotate-0"
            )}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        <span
          className={cx(
            "truncate text-left text-sm md:text-[15px]",
            isActive ? "text-blue-700 font-medium" : "text-slate-700"
          )}
          style={{ paddingLeft: depth * 8 }}
        >
          {node.name}
        </span>
      </button>

      {hasChildren && open && (
        <div className="ml-4 border-l border-slate-200 pl-2">
          {node.children!.map((child) => (
            <TreeLeaf
              key={child.id}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeLeaf({
  node,
  depth = 1,
  activePath,
  onSelect,
}: {
  node: Folder;
  depth?: number;
  activePath: string[];
  onSelect: (path: string[]) => void;
}) {
  const hasChildren = !!node.children?.length;
  const [open, setOpen] = useState(true);
  const isActive = activePath[activePath.length - 1] === node.name;

  return (
    <div className="select-none">
      <button
        className={cx(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-100",
          isActive && "bg-blue-50 ring-1 ring-inset ring-blue-200"
        )}
        onClick={() => {
          onSelect(activePath[0] ? [activePath[0], node.name] : [node.name]);
          if (hasChildren) setOpen((s) => !s);
        }}
        title={node.name}
      >
        {hasChildren ? (
          <svg
            className={cx(
              "h-4 w-4 transition-transform",
              open ? "rotate-90" : "rotate-0"
            )}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg className="h-4 w-4 opacity-60" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}

        <span
          className={cx(
            "truncate text-left text-sm md:text-[15px]",
            isActive ? "text-blue-700 font-medium" : "text-slate-700"
          )}
          style={{ paddingLeft: depth * 8 }}
        >
          {node.name}
        </span>
      </button>

      {hasChildren && open && (
        <div className="ml-4 border-l border-slate-200 pl-2">
          {node.children!.map((child) => (
            <TreeLeaf
              key={child.id}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}