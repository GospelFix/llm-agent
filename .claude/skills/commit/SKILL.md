---
name: commit
description: 변경사항을 분석해 한국어 커밋 메시지로 커밋합니다
argument-hint: "[커밋 메시지 힌트 (선택)]"
user-invocable: true
context: fork
agent: commit-push-agent
---

commit-push-agent 에이전트를 사용해 현재 변경사항을 커밋하세요.

사용자가 추가 힌트를 전달했다면: $ARGUMENTS

힌트가 있으면 커밋 메시지 작성 시 참고하세요.
