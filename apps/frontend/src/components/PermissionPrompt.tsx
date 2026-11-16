import type { ClientMessage, PermissionRequest } from "common";

export function PermissionPrompt({ requests, send }: { requests: PermissionRequest[]; send: (message: ClientMessage) => boolean }) {
  if (!requests.length) return null;
  return <section className="permission-list" aria-label="Permission requests">
    {requests.map((request) => <div key={request.requestId} className="permission-request">
      <strong>Agent requests permission</strong>
      <p>Review the action before allowing it. The request expires after five minutes.</p>
      <pre>{request.description}</pre>
      {request.options.map((option) => <button key={option.id} type="button" onClick={() => send({ type: "permission_response", requestId: request.requestId, optionId: option.id })}>{option.label}</button>)}
      <button type="button" onClick={() => send({ type: "permission_response", requestId: request.requestId, optionId: null })}>Decline</button>
    </div>)}
  </section>;
}
