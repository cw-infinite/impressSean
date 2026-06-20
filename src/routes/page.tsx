import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { databases } from "@/lib/appwrite";
import { ID, Permission, Query, Role } from "appwrite";
import {
	buildTemplateSeed,
	DEFAULT_PROJECT,
	makeStyle,
	makeTypography,
	normalizeProject,
	TemplateId,
	uid,
} from "@/utils/constans";
import { TopBar } from "@/components/TopBar";
import { CreateProject, Dashboard } from "@/components/Dashboard";
import { Editor } from "@/components/Editor";
import { Reports } from "@/components/Reports";
import { importProjectFromFile } from "@/components/ExImport";

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const COL_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// ============ APPWRITE HOOK ============
function useAppwrite(user: any) {
	const getProjects = useCallback(async (): Promise<ProjectMeta[]> => {
		if (!user?.$id) return [];
		const res = await databases.listDocuments(DB_ID, COL_ID, [
			Query.equal("userId", user.$id),
			Query.orderDesc("updatedAt"),
			Query.limit(100),
		]);
		return res.documents.map((d) => ({
			id: d.$id,
			name: d.name,
			createdAt: d.createdAt,
			updatedAt: d.updatedAt,
			thumbnailColor: d.thumbnailColor,
		}));
	}, [user]);

	const getProject = useCallback(async (id: string): Promise<Project> => {
		const doc = await databases.getDocument(DB_ID, COL_ID, id);
		return normalizeProject({
			id: doc.$id,
			name: doc.name,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt,
			thumbnailColor: doc.thumbnailColor,
			canvasWidth: doc.canvasWidth,
			canvasHeight: doc.canvasHeight,
			elements: JSON.parse(doc.elements || "[]"),
			connections: JSON.parse(doc.connections || "[]"),
			comments: JSON.parse(doc.comments || "[]"),
			activity: JSON.parse(doc.activity || "[]"),
		});
	}, []);

	const saveProject = useCallback(
		async (proj: Project) => {
			if (!user?.$id) throw new Error("Not signed in");
			const payload = {
				userId: user.$id,
				name: proj.name,
				createdAt: proj.createdAt,
				updatedAt: Date.now(),
				thumbnailColor: proj.thumbnailColor,
				canvasWidth: proj.canvasWidth,
				canvasHeight: proj.canvasHeight,
				elements: JSON.stringify(proj.elements),
				connections: JSON.stringify(proj.connections),
				comments: JSON.stringify(proj.comments),
				activity: JSON.stringify(proj.activity),
			};
			const perms = [
				Permission.read(Role.user(user.$id)),
				Permission.update(Role.user(user.$id)),
				Permission.delete(Role.user(user.$id)),
			];
			try {
				await databases.getDocument(DB_ID, COL_ID, proj.id);
				await databases.updateDocument(DB_ID, COL_ID, proj.id, payload, perms);
			} catch {
				await databases.createDocument(DB_ID, COL_ID, proj.id, payload, perms);
			}
		},
		[user],
	);

	const createProject = useCallback(
		async (
			name: string,
			canvasWidth?: number,
			canvasHeight?: number,
		): Promise<string> => {
			if (!user?.$id) throw new Error("Not signed in");
			const p = DEFAULT_PROJECT(name, canvasWidth, canvasHeight);
			const payload = {
				userId: user.$id,
				name: p.name,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
				thumbnailColor: p.thumbnailColor,
				canvasWidth: p.canvasWidth,
				canvasHeight: p.canvasHeight,
				elements: "[]",
				connections: "[]",
				comments: "[]",
				activity: JSON.stringify(p.activity),
			};
			const doc = await databases.createDocument(DB_ID, COL_ID, p.id, payload, [
				Permission.read(Role.user(user.$id)),
				Permission.update(Role.user(user.$id)),
				Permission.delete(Role.user(user.$id)),
			]);
			return doc.$id;
		},
		[user],
	);

	const deleteProject = useCallback(async (id: string) => {
		await databases.deleteDocument(DB_ID, COL_ID, id);
	}, []);

	return useMemo(
		() => ({
			getProjects,
			getProject,
			saveProject,
			createProject,
			deleteProject,
		}),
		[getProjects, getProject, saveProject, createProject, deleteProject],
	);
}

export const Route = createFileRoute("/page")({
	component: RouteComponent,
});

// ============ MAIN COMPONENT ============

function RouteComponent() {
	const { user, loading, logout } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (!user && !loading) navigate({ to: "/", replace: true });
	}, [user, navigate]);

	const appwrite = useAppwrite(user);
	const [loaded, setLoaded] = useState(false);
	const [projects, setProjects] = useState<ProjectMeta[]>([]);
	const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
	const [view, setView] = useState<View>("dashboard");
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [activeProject, setActiveProject] = useState<Project | null>(null);

	// Load on mount from Appwrite
	useEffect(() => {
		if (!user) return;
		let cancelled = false;
		(async () => {
			try {
				const metas = await appwrite.getProjects();
				if (cancelled) return;

				if (metas.length > 0) {
					setProjects(metas);
				}
			} finally {
				if (!cancelled) setLoaded(true);
			}
		})();
		// Cleanup so an in-flight async block from an old user session doesn't set state
		return () => {
			cancelled = true;
		};
	}, [user]);

	const loadProject = useCallback(
		async (id: string) => {
			const p = await appwrite.getProject(id);
			setActiveProject(p);
			setActiveProjectId(id);
		},
		[appwrite],
	);

	const saveActiveProject = useCallback(
		async (proj: Project) => {
			if (!proj) return;
			setSaveStatus("saving");
			const toSave = { ...proj, updatedAt: Date.now() };
			await appwrite.saveProject(toSave);
			setActiveProject(toSave);
			setProjects((prev) =>
				prev.map((p) =>
					p.id === toSave.id
						? { ...p, name: toSave.name, updatedAt: toSave.updatedAt }
						: p,
				),
			);
			setSaveStatus("saved");
			setTimeout(() => setSaveStatus("idle"), 1200);
		},
		[appwrite],
	);

	const handleCreateProject = useCallback(
		async (
			name: string,
			template: TemplateId,
			canvasWidth: number,
			canvasHeight: number,
		) => {
			const id = await appwrite.createProject(
				name || "Untitled project",
				canvasWidth,
				canvasHeight,
			);
			const seed = buildTemplateSeed(template);
			const base = await appwrite.getProject(id);
			const seeded: Project = {
				...base,
				elements: seed.elements,
				connections: seed.connections,
				comments: seed.comments,
			};
			await appwrite.saveProject(seeded);
			setProjects(await appwrite.getProjects());
			setActiveProject(seeded);
			setActiveProjectId(id);
			setView("editor");
		},
		[appwrite],
	);

	const deleteProject = useCallback(
		async (id: string) => {
			await appwrite.deleteProject(id);
			setProjects((prev) => prev.filter((p) => p.id !== id));
			if (activeProjectId === id) {
				setActiveProjectId(null);
				setActiveProject(null);
				setView("dashboard");
			}
		},
		[appwrite, activeProjectId],
	);

	const importProject = useCallback(
		async (file: File) => {
			const project = await importProjectFromFile(file);
			await appwrite.saveProject(project);
			setProjects(await appwrite.getProjects());
			setActiveProject(project);
			setActiveProjectId(project.id);
			setView("editor");
		},
		[appwrite],
	);

	if (!loaded) {
		return (
			<div
				style={{
					padding: 40,
					textAlign: "center",
					color: "#6b7280",
					fontFamily: "ui-sans-serif",
				}}
			>
				Loading workspace…
			</div>
		);
	}

	return (
		<div
			style={{
				fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
				background: "#f7f7f8",
				minHeight: "100vh",
				color: "#111827",
			}}
		>
			<TopBar
				view={view}
				setView={setView}
				activeProject={activeProject}
				saveStatus={saveStatus}
				onBack={() => {
					setView("dashboard");
				}}
				onImportProject={importProject}
				onLogout={logout}
			/>
			{view === "dashboard" && (
				<Dashboard
					projects={projects}
					onOpen={async (id: string) => {
						await loadProject(id);
						setView("editor");
					}}
					onNewProject={() => setView("create")}
					onDelete={deleteProject}
					onReports={async (id: string) => {
						await loadProject(id);
						setView("reports");
					}}
				/>
			)}
			{view === "create" && (
				<CreateProject
					onCancel={() => setView("dashboard")}
					onSubmit={handleCreateProject}
				/>
			)}
			{view === "editor" && activeProject && (
				<Editor
					project={activeProject}
					setProject={setActiveProject}
					onSave={saveActiveProject}
					saveStatus={saveStatus}
				/>
			)}
			{view === "reports" && activeProject && (
				<Reports project={activeProject} allProjects={projects} />
			)}
		</div>
	);
}
