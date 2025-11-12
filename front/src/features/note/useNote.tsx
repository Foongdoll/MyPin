import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import NoteService from "./NoteService";
import type { CategoryCreatePayload, CategoryNode, NoteListResponse, NoteSummary } from "../../shared/types/NoteType";
import { buildDefaultOpenState, flattenCategories, type FlatCategory } from "./utils";

const PAGE_SIZE = 6;

type SelectedCategoryState = {
  label: string;
  path?: string;
  code?: string;
};

const useNote = () => {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("최신순");
  const [selectedCategory, setSelectedCategory] = useState<SelectedCategoryState>({ label: "ALL" });
  const [open, setOpen] = useState<Record<number, boolean>>({});

  const categoriesQuery = useQuery<CategoryNode[]>({
    queryKey: ["note", "categories"],
    queryFn: NoteService.fetchCategories,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!categoriesQuery.data) return;
    setOpen((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return buildDefaultOpenState(categoriesQuery.data);
    });
  }, [categoriesQuery.data]);

  const notesQuery = useQuery<NoteListResponse>({
    queryKey: ["note", "list", { page, q, categoryPath: selectedCategory.path }],
    queryFn: () =>
      NoteService.fetchNotes({
        page,
        pageSize: PAGE_SIZE,
        q: q.trim() || undefined,
        categoryPath: selectedCategory.path,
      }),
    placeholderData: keepPreviousData,
  });

  const flatCategories = useMemo<FlatCategory[]>(() => flattenCategories(categoriesQuery.data ?? []), [categoriesQuery.data]);

  const notes = (notesQuery.data?.items ?? []) as NoteSummary[];
  const total = notesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const selectCategory = (node?: CategoryNode | null) => {
    if (!node) {
      setSelectedCategory({ label: "ALL" });
    } else {
      setSelectedCategory({ label: node.label, path: node.path, code: node.code });
    }
    setPage(1);
  };

  const createCategoryMutation = useMutation({
    mutationFn: (payload: CategoryCreatePayload) => NoteService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note", "categories"] });
    },
  });

  const createCategory = (payload: CategoryCreatePayload) => createCategoryMutation.mutateAsync(payload);

  const refreshNotes = () => {
    queryClient.invalidateQueries({ queryKey: ["note", "list"] });
  };

  return {
    q,
    setQ,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    sort,
    setSort,
    notes,
    total,
    totalPages,
    isNotesLoading: notesQuery.isLoading,
    isNotesFetching: notesQuery.isFetching,
    selectedCategory,
    selectCategory,
    categories: categoriesQuery.data ?? [],
    isCategoriesLoading: categoriesQuery.isLoading,
    flatCategories,
    open,
    setOpen,
    createCategory,
    isCreatingCategory: createCategoryMutation.isPending,
    refreshNotes,
  };
};

export default useNote;
