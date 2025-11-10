import { useEffect, useMemo, useState } from "react";
import type { Folder, Note } from "../../shared/types/NoteType";
import { NoteService } from "./NoteService";
const FOLDERS: Folder[] = [
    {
        id: "dev",
        name: "개발",
        children: [
            { id: "react", name: "React" },
            { id: "spring", name: "Spring Boot" },
            { id: "db", name: "Database" },
        ],
    },
    {
        id: "design",
        name: "디자인",
        children: [
            { id: "ux", name: "UX" },
            { id: "ui", name: "UI" },
        ],
    },
    {
        id: "life",
        name: "일상",
        children: [
            { id: "diary", name: "Diary" },
            { id: "reading", name: "독서" },
        ],
    },
];

const NOTES: Note[] = [
    {
        id: "n1",
        title: "React 상태 관리 베스트 프랙티스",
        categoryPath: ["개발", "React"],
        date: "2025-11-05",
        excerpt:
            "Zustand, React Query, Context의 적절한 역할 분리와 폴더 구조에 대한 정리...",
        tags: ["React", "Zustand", "RQuery"],
    },
    {
        id: "n2",
        title: "Spring Boot 인증 전략 정리",
        categoryPath: ["개발", "Spring Boot"],
        date: "2025-10-21",
        excerpt: "JWT, Refresh Token, 필터 체인, 권한 가드 설계 포인트.",
        tags: ["Spring", "Security", "JWT"],
    },
    {
        id: "n3",
        title: "데이터베이스 인덱스 설계",
        categoryPath: ["개발", "Database"],
        date: "2025-09-14",
        excerpt: "카디널리티, 커버링 인덱스, 조인 전략과 실행계획 체크리스트.",
        tags: ["DB", "Index"],
    },
    {
        id: "n4",
        title: "UX 라이팅 가이드",
        categoryPath: ["디자인", "UX"],
        date: "2025-11-01",
        excerpt: "버튼/라벨/에러메시지 톤앤매너와 마이크로카피 패턴.",
        tags: ["UX", "Writing"],
    },
    {
        id: "n5",
        title: "UI 컴포넌트 토큰 설계",
        categoryPath: ["디자인", "UI"],
        date: "2025-10-03",
        excerpt: "컬러/타이포/스페이싱 토큰으로 확장성 확보하기.",
        tags: ["UI", "DesignTokens"],
    },
    {
        id: "n6",
        title: "독서 메모) 프레임",
        categoryPath: ["일상", "독서"],
        date: "2025-08-19",
        excerpt:
            "사고의 틀을 바꾸는 프레이밍에 관한 서평과 핵심 인용 정리.",
        tags: ["Book"],
    },
];

const useNote = () => {
    // 좌측: 폴더 트리 선택 상태 (루트/서브 경로)
    const [activeCategory, setActiveCategory] = useState<string[]>([]);

    // 우측: 검색/필터/정렬/페이징
    const [query, setQuery] = useState("");
    const [tagFilter, setTagFilter] = useState<string>("ALL");
    const [sortKey, setSortKey] = useState<"recent" | "title">("recent");
    const [page, setPage] = useState(1);
    const pageSize = 6;

    const [detailId, setDetailId] = useState<string | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editNote, setEditNote] = useState<any | null>(null);

    const openDetail = (id: string) => setDetailId(id);
    const closeDetail = () => setDetailId(null);

    const openCreate = () => { setEditNote(null); setEditorOpen(true); };
    const openEdit = (note: any) => { setEditNote(note); setEditorOpen(true); };
    const closeEditor = () => setEditorOpen(false);

    const afterSaved = (id: string) => {
        // 저장 후 상세로 바로 이동하거나 목록 갱신 로직 추가 가능
        setDetailId(id);
    };

    // 태그 목록(디자인용)
    const allTags = useMemo(() => {
        const uniq = new Set<string>();
        NOTES.forEach((n) => n.tags?.forEach((t) => uniq.add(t)));
        return ["ALL", ...Array.from(uniq)];
    }, []);

    // 필터링된 노트
    const filtered = useMemo(() => {
        const catPath = activeCategory;
        return NOTES.filter((n) => {
            const inCategory =
                catPath.length === 0 ||
                catPath.every((c) => n.categoryPath.includes(c));
            const inQuery =
                !query ||
                n.title.toLowerCase().includes(query.toLowerCase()) ||
                n.excerpt.toLowerCase().includes(query.toLowerCase());
            const inTag =
                tagFilter === "ALL" ||
                (n.tags ?? []).map((t) => t.toLowerCase()).includes(tagFilter.toLowerCase());
            return inCategory && inQuery && inTag;
        }).sort((a, b) => {
            if (sortKey === "recent") {
                return b.date.localeCompare(a.date);
            }
            return a.title.localeCompare(b.title);
        });
    }, [activeCategory, query, tagFilter, sortKey]);

    // 페이징
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);

    // 카테고리 경로 표시용
    const breadcrumb =
        activeCategory.length > 0 ? activeCategory.join(" / ") : "전체";




    // 카테고리, 노트 조회
    useEffect(() => {

        const fetchNote = () => {

            // const notes = await NoteService.list()
        }

        const fetchCategory = () => {

        }

        fetchNote();
        fetchCategory();

    }, [activeCategory])


    
    return {
        FOLDERS, NOTES,
        // state
        activeCategory, setActiveCategory,
        query, setQuery,
        tagFilter, setTagFilter,
        sortKey, setSortKey,
        page, setPage,
        pageSize,

        // derived
        allTags,
        filtered,
        totalPages,
        start,
        pageData,
        breadcrumb,

        // data (디자인용 더미)
        folders: FOLDERS,
        notes: NOTES,

        // helpers
        selectCategory: (path: string[]) => { setActiveCategory(path); setPage(1); },
        resetCategory: () => { setActiveCategory([]); setPage(1); },
        setQueryAndReset: (v: string) => { setQuery(v); setPage(1); },
        setTagFilterAndReset: (v: string) => { setTagFilter(v); setPage(1); },
        setSortAndReset: (v: "recent" | "title") => { setSortKey(v); setPage(1); },

        detailId, editorOpen, closeDetail,
        openDetail, openEdit, afterSaved, closeEditor, editNote
    };
}
export default useNote