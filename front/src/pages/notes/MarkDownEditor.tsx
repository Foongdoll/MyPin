import { useRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import remarkGfm from "remark-gfm";
import { NoteService } from "../../features/note/NoteService";

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export default function MarkdownEditor({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handlePick = () => inputRef.current?.click();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { url } = await NoteService.uploadImage(f);
      // 커서 위치에 이미지 마크다운 삽입
      const imgMd = `\n\n![](${url})\n\n`;
      onChange((value || "") + imgMd);
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 실패");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePick}
          className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
        >
          이미지 업로드
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <MDEditor
        value={value}
        onChange={(v) => onChange(v || "")}
        previewOptions={{ remarkPlugins: [remarkGfm] }}
        height={480}
      />
      <div data-color-mode="light">
        <MDEditor.Markdown source={value} remarkPlugins={[remarkGfm]} />
      </div>
    </div>
  );
}
