import { btnGhost, inputStyle } from "@/utils/constans";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function CommentPinView({
	index,
	comment,
	open,
	onToggle,
	onSave,
	onDelete,
}: {
	index: number;
	comment: CommentPin;
	open: boolean;
	onToggle: () => void;
	onSave: (text: string) => void;
	onDelete: () => void;
}) {
	const [editText, setEditText] = useState(comment.text);
	useEffect(() => {
		setEditText(comment.text);
	}, [comment.text, open]);

	return (
		<div
			style={{
				position: "absolute",
				left: comment.x,
				top: comment.y,
				zIndex: 6,
			}}
			onClick={(e) => e.stopPropagation()}
		>
			<div
				onClick={onToggle}
				title={comment.text}
				style={{
					width: 26,
					height: 26,
					borderRadius: "50% 50% 50% 4px",
					background: "#F59E0B",
					color: "#fff",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: 11,
					fontWeight: 700,
					cursor: "pointer",
					boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
					transform: "translate(0, -100%)",
				}}
			>
				{index}
			</div>
			{open && (
				<div
					style={{
						position: "absolute",
						top: 4,
						left: 0,
						width: 220,
						background: "#fff",
						borderRadius: 10,
						boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
						padding: 10,
						border: "1px solid #e5e7eb",
					}}
				>
					<textarea
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						onBlur={() => onSave(editText)}
						autoFocus
						rows={3}
						style={{ ...inputStyle, resize: "none", marginBottom: 8 }}
					/>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<span style={{ fontSize: 10, color: "#9ca3af" }}>
							{new Date(comment.createdAt).toLocaleString()}
						</span>
						<button
							onClick={onDelete}
							style={{
								border: "none",
								background: "transparent",
								color: "#ef4444",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
							}}
						>
							<Trash2 size={13} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

export function DraftCommentBubble({
	draft,
	onCommit,
	onCancel,
}: {
	draft: { id: string; x: number; y: number; text: string };
	onCommit: (text: string) => void;
	onCancel: () => void;
}) {
	const [text, setText] = useState("");
	return (
		<div
			style={{ position: "absolute", left: draft.x, top: draft.y, zIndex: 7 }}
			onClick={(e) => e.stopPropagation()}
		>
			<div
				style={{
					width: 26,
					height: 26,
					borderRadius: "50% 50% 50% 4px",
					background: "#F59E0B",
					transform: "translate(0, -100%)",
				}}
			/>
			<div
				style={{
					position: "absolute",
					top: 4,
					left: 0,
					width: 220,
					background: "#fff",
					borderRadius: 10,
					boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
					padding: 10,
					border: "1px solid #e5e7eb",
				}}
			>
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Leave a comment…"
					autoFocus
					rows={3}
					style={{ ...inputStyle, resize: "none", marginBottom: 8 }}
					onKeyDown={(e) => {
						if (e.key === "Escape") onCancel();
					}}
				/>
				<div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
					<button
						onClick={onCancel}
						style={{ ...btnGhost, border: "1px solid #e5e7eb", fontSize: 12 }}
					>
						Cancel
					</button>
					<button
						onClick={() => onCommit(text)}
						style={{
							background: "#7C3AED",
							color: "#fff",
							border: "none",
							padding: "6px 12px",
							borderRadius: 7,
							fontSize: 12,
							cursor: "pointer",
						}}
					>
						Comment
					</button>
				</div>
			</div>
		</div>
	);
}
