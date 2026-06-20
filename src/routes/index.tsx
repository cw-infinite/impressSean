import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
	animate,
	stagger,
	onScroll,
	utils,
	scrambleText,
	createScope,
} from "animejs";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
	component: AnimatedLoginForSean,
});

function AnimatedLoginForSean() {
	const { login, loading, error, clearError } = useAuth();
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const cardRef = useRef<HTMLDivElement>(null);
	const orb1Ref = useRef<HTMLDivElement>(null);
	const orb2Ref = useRef<HTMLDivElement>(null);

	const h1Ref = useRef<HTMLHeadingElement>(null);
	const signinBtn = useRef<HTMLParagraphElement>(null);

	useEffect(() => {
		if (!cardRef.current) return;

		const cardAnim = animate(cardRef.current, {
			opacity: [0, 1],
			translateY: [60, 0],
			scale: [0.9, 1],
			duration: 1200,
			ease: "outElastic(1, .8)",
		});

		animate(".input-wrap", {
			opacity: [0, 1],
			translateY: [20, 0],
			delay: stagger(100, { start: 400 }),
			duration: 800,
			ease: "outQuad",
		});

		animate(orb1Ref.current!, {
			x: [
				{ to: 100, duration: 4000 },
				{ to: -100, duration: 4000 },
				{ to: 0, duration: 4000 },
			],
			y: [
				{ to: -80, duration: 4000 },
				{ to: 80, duration: 4000 },
				{ to: 0, duration: 4000 },
			],
			ease: "inOutSine",
			loop: true,
		});

		animate(orb2Ref.current!, {
			x: [
				{ to: -120, duration: 5000 },
				{ to: 120, duration: 5000 },
				{ to: 0, duration: 5000 },
			],
			y: [
				{ to: 100, duration: 5000 },
				{ to: -100, duration: 5000 },
				{ to: 0, duration: 5000 },
			],
			ease: "inOutSine",
			loop: true,
			delay: 1000,
		});

		animate(h1Ref.current!, {
			innerHTML: scrambleText({ text: "Welcome Sean!", revealDelay: 500 }),
		});

		return () => {
			cardAnim.revert();
		};
	}, []);

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!cardRef.current) return;
		const rect = cardRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width / 2;
		const y = e.clientY - rect.top - rect.height / 2;

		animate(cardRef.current, {
			rotateY: x / 20,
			rotateX: -y / 20,
			duration: 300,
			ease: "outQuad",
		});
	};

	const handleMouseLeave = () => {
		animate(cardRef.current!, {
			rotateY: 0,
			rotateX: 0,
			duration: 500,
			ease: "outElastic(1, .6)",
		});
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		animate(".submit-btn", {
			scale: [1, 0.9, 1.05, 1],
			backgroundColor: ["#a8b2b8", "#0a54a6", "#7c8489"],
			duration: 600,
			ease: "inOutQuad",
		});

		const formData = new FormData(e.currentTarget);
		const allValues = Object.fromEntries(formData.entries());
		try {
			await login(String(allValues.email), String(allValues.password));

			animate(h1Ref.current!, {
				innerHTML: scrambleText({
					chars: "numbers",
					text: "Hope this is interesting!",
				}),
			});

			animate(signinBtn.current!, {
				innerHTML: scrambleText({
					ease: "linear",
					override: false,
					text: "Loading...",
				}),
			});

			setTimeout(() => {
				navigate({ to: "/page" });
			}, 2000);
		} catch (err) {
			// Error is handled in the context
			console.error("Login failed:", err);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSubmit(e);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 #b5c3ca #021822 flex items-center justify-center p-6 overflow-hidden relative">
			<div
				ref={orb1Ref}
				className="absolute w-96 h-96 #b5c3ca rounded-full blur-3xl opacity-30"
			/>
			<div
				ref={orb2Ref}
				className="absolute w-96 h-96 b#021822 rounded-full blur-3xl opacity-30"
			/>

			<div
				ref={cardRef}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				className="relative w-full max-w-md opacity-0"
				style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
			>
				<div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
					<h1 ref={h1Ref} className="text-3xl font-bold text-white mb-2">
						Welcome back
					</h1>
					{/* <h2 ref={h2Ref} className="text-1xl font-bold text-white mb-2">Welcome back</h2> */}
					<p className="text-white/60 mb-8">Sign in to continue</p>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div className="input-wrap opacity-0">
							<input
								name="email"
								type="email"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:#4e6680 focus:bg-white/15 transition-all"
							/>
						</div>
						<div className="input-wrap opacity-0">
							<input
								name="password"
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:#4e6680 focus:bg-white/15 transition-all"
							/>
						</div>
						<div className="input-wrap opacity-0">
							<button
								type="submit"
								onKeyDown={handleKeyDown}
								className="submit-btn w-full #021822 hover:#075376 text-white font-semibold py-3 rounded-lg transition-colors"
							>
								<p ref={signinBtn}>Sign In</p>
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
