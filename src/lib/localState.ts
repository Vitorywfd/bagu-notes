const KEY = "bagu-notes-ui-v1";

export type LocalUiState = {
  chapterId: string;
  questionId: string;
  answerOpen: boolean;
  favoriteOnly: boolean;
};

export function loadLocalUiState(): LocalUiState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw new Error("empty");
    return { chapterId: "", questionId: "", answerOpen: false, favoriteOnly: false, ...JSON.parse(raw) };
  } catch {
    return { chapterId: "", questionId: "", answerOpen: false, favoriteOnly: false };
  }
}

export function saveLocalUiState(state: LocalUiState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
