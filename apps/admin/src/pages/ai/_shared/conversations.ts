// 대화 저장소 (픽스처)
//
// [백엔드 없음] mutable 배열을 아래 쓰기 함수가 갱신한다 — 실제 네트워크 0건. 연동 지점은
// data-source.ts 의 // TODO(backend) 주석이다. 정본이 서버로 옮겨가면 이 배열이 서버 상태가 된다.
//
// [새로고침하면 사라진다] 저장소에 쓰지 않는다. 대화는 서버가 가져야 할 것이고, localStorage 에
// 넣으면 '저장됐다' 는 인상만 주고 다른 기기에서는 없다 — 지금 없는 기능을 있는 것처럼 보이게 한다.
// 이 사실은 화면(대화 목록)이 문구로 밝힌다.
import type { AgentAnswer } from './answer';

export type MessageRole = 'user' | 'agent';

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  /** 사용자 메시지의 원문 — 에이전트 메시지는 answer 가 내용을 갖는다 */
  readonly text: string;
  /** role 이 'agent' 일 때만 채워진다 */
  readonly answer: AgentAnswer | null;
  /** 조회에 걸린 시간(ms) — '3초 동안 조회함' 표시에 쓴다. 지어낸 값이 아니라 실측이다 */
  readonly elapsedMs: number;
  readonly createdAtIso: string;
}

export interface Conversation {
  readonly id: string;
  /** 첫 질문에서 따온 제목 */
  readonly title: string;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
  readonly messages: readonly ChatMessage[];
}

/**
 * 초기 대화 — 목록 화면이 처음부터 빈 상태는 아니게 한다.
 *
 * [왜 답변이 비어 있나] 픽스처에 **답변 본문을 넣지 않는다.** 넣으려면 그 답이 어떤 데이터에서
 * 나왔는지 꾸며내야 하고, 그러면 픽스처가 거짓 답변을 갖게 된다. 지난 대화는 질문만 남기고,
 * 답은 열었을 때 실제 데이터로 다시 계산한다.
 */
let conversations: readonly Conversation[] = [];

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

/**
 * 질문에서 제목을 딴다 — 멘션을 걷어내고 앞부분만.
 *
 * 멘션을 지우면 그 뒤에 붙어 있던 조사가 맨 앞에 남는다('@고객목록 **의** 이번달…' → '의 이번달…').
 * 제목이 조사로 시작하면 목록에서 읽기 어렵다 — 그래서 앞머리의 조사를 함께 턴다.
 */
export function titleFromQuestion(question: string): string {
  const cleaned = question
    .replace(/@\S+/g, '')
    .replace(/^[\s]*(?:의|을|를|은|는|이|가|에서|에)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const base = cleaned === '' ? question.trim() : cleaned;
  if (base === '') return '새 대화';
  return base.length > TITLE_MAX ? `${base.slice(0, TITLE_MAX)}…` : base;
}

const TITLE_MAX = 30;

export function listConversations(): readonly Conversation[] {
  // 최근 갱신 순 — 목록과 좌측 기록이 같은 순서를 본다
  return [...conversations].sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
}

export function findConversation(id: string): Conversation | null {
  return conversations.find((conversation) => conversation.id === id) ?? null;
}

export function createConversation(title: string, nowIso: string): Conversation {
  const conversation: Conversation = {
    id: nextId('CV'),
    title,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    messages: [],
  };
  conversations = [conversation, ...conversations];
  return conversation;
}

/** 메시지를 덧붙인다 — 대화가 그 사이 지워졌으면 null (호출부가 '삭제됨' 을 알아야 한다) */
export function appendMessages(
  conversationId: string,
  messages: readonly ChatMessage[],
  nowIso: string,
): Conversation | null {
  const current = findConversation(conversationId);
  if (current === null) return null;

  const updated: Conversation = {
    ...current,
    updatedAtIso: nowIso,
    messages: [...current.messages, ...messages],
  };
  conversations = conversations.map((item) => (item.id === conversationId ? updated : item));
  return updated;
}

export function removeConversations(ids: readonly string[]): void {
  const doomed = new Set(ids);
  conversations = conversations.filter((conversation) => !doomed.has(conversation.id));
}

export function makeMessage(
  role: MessageRole,
  text: string,
  answer: AgentAnswer | null,
  elapsedMs: number,
  nowIso: string,
): ChatMessage {
  return { id: nextId('MSG'), role, text, answer, elapsedMs, createdAtIso: nowIso };
}

/** 테스트가 저장소를 초기 상태로 되돌린다 */
export function resetConversations(seed: readonly Conversation[] = []): void {
  conversations = seed;
  sequence = 0;
}
