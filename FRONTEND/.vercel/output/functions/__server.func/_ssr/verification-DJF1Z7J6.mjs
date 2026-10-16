import { i as __toESM } from "../_runtime.mjs";
import { m as platform, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { I as FileCheckCorner, p as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { c as Metric, d as Shell, l as PageHeader, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as DataTable } from "./data-table-Bm1wJeTq.mjs";
import { r as sha256File, t as evidenceReferenceSchema } from "./schemas-DwfNRHoV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/verification-DJF1Z7J6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TYPES = [
	{
		value: "identity",
		label: "Identity (national ID / passport)"
	},
	{
		value: "business",
		label: "Business registration"
	},
	{
		value: "address",
		label: "Proof of address"
	},
	{
		value: "ownership",
		label: "Beneficial ownership"
	}
];
var TIERS = [
	{
		status: "PENDING",
		name: "Unverified",
		needs: "Phone number only. Small everyday payments."
	},
	{
		status: "VERIFIED",
		name: "Verified",
		needs: "Identity verified by the compliance team."
	},
	{
		status: "BUSINESS_VERIFIED",
		name: "Business verified",
		needs: "Identity and business registration verified. Trade-sized limits."
	}
];
var usd = (n) => `USD ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
function Meter({ label, used, cap }) {
	const pct = cap > 0 ? Math.min(100, used / cap * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline justify-between text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "tabular font-mono",
			children: [
				usd(used),
				" / ",
				usd(cap)
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "progressbar",
		"aria-label": label,
		"aria-valuemin": 0,
		"aria-valuemax": cap,
		"aria-valuenow": Math.round(used),
		className: "mt-1.5 h-1.5 w-full bg-muted",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full bg-foreground",
			style: { width: `${pct}%` }
		})
	})] });
}
function StandingCard({ standing, tiers }) {
	const blocked = standing.limits.per_txn_usd <= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		title: "Your standing",
		meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
			tone: blocked ? "warn" : "invert",
			children: standing.kyc_status.replace("_", " ")
		}),
		children: [blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			role: "alert",
			className: "border-2 border-foreground p-3 text-sm",
			children: [
				"Payments are currently disabled for this account (",
				standing.kyc_status,
				"). Contact support to resolve your verification."
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-3 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Per payment",
							value: usd(standing.limits.per_txn_usd)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Per day",
							value: usd(standing.limits.daily_usd)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Per month",
							value: usd(standing.limits.monthly_usd)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
					label: "Used in the last 24 hours",
					used: standing.used_day_usd,
					cap: standing.limits.daily_usd
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
					label: "Used in the last 30 days",
					used: standing.used_month_usd,
					cap: standing.limits.monthly_usd
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-6 grid gap-2 sm:grid-cols-3",
			"aria-label": "Verification levels",
			children: TIERS.map((tier) => {
				const lim = tiers?.[tier.status];
				const current = tier.status === standing.kyc_status;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: current ? "border-2 border-foreground p-3" : "border border-border p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: tier.name
							}), current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
								tone: "invert",
								children: "You are here"
							}) : null]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: tier.needs
						}),
						lim ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 font-mono text-[11px]",
							children: [
								usd(lim.per_txn_usd),
								" per payment · ",
								usd(lim.daily_usd),
								" / day"
							]
						}) : null
					]
				}, tier.status);
			})
		})]
	});
}
function Verification() {
	const qc = useQueryClient();
	const kyc = useQuery({
		queryKey: ["kyc"],
		queryFn: platform.kyc
	});
	const config = useQuery({
		queryKey: ["public-config"],
		queryFn: platform.config,
		staleTime: 3e5
	});
	const [type, setType] = (0, import_react.useState)("identity");
	const [mode, setMode] = (0, import_react.useState)("file");
	const [file, setFile] = (0, import_react.useState)(null);
	const [digest, setDigest] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [hashing, setHashing] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function onFile(f) {
		setFile(f);
		setDigest("");
		setError(null);
		if (!f) return;
		if (f.size > 26214400) {
			setError("Choose a file under 25 MB.");
			return;
		}
		setHashing(true);
		try {
			setDigest(await sha256File(f));
		} catch {
			setError("Could not read that file.");
		} finally {
			setHashing(false);
		}
	}
	const evidenceRef = mode === "file" ? digest ? `hash:sha256:${digest}` : "" : reference.trim();
	const submit = useMutation({
		mutationFn: () => {
			const parsed = evidenceReferenceSchema.safeParse(evidenceRef);
			if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid reference");
			const label = mode === "file" && file ? `${file.name} (hash only)` : void 0;
			return platform.submitKyc({
				verification_type: type,
				reference: parsed.data,
				...label ? { evidence_label: label.slice(0, 160) } : {}
			});
		},
		onSuccess: () => {
			toast.success("Evidence submitted", { description: "The compliance team will review it." });
			setFile(null);
			setDigest("");
			setReference("");
			qc.invalidateQueries({ queryKey: ["kyc"] });
			qc.invalidateQueries({ queryKey: ["wallet"] });
		},
		onError: (e) => setError(describeError(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Compliance",
			title: "Verification & Limits",
			description: "Higher verification unlocks larger payments. VUKA never stores your documents: you keep them, and only a cryptographic fingerprint (or a reference from a verification provider) is filed."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
			query: kyc,
			children: (data) => data.standing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StandingCard, {
				standing: data.standing,
				tiers: config.data?.kyc_limits ?? null
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "border border-dashed border-border p-4 text-sm text-muted-foreground",
				children: "Transaction limits are not configured on this engine."
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[420px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Submit evidence",
				meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
					className: "size-4 text-muted-foreground",
					"aria-hidden": "true"
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "space-y-4",
					onSubmit: (e) => {
						e.preventDefault();
						setError(null);
						submit.mutate();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "kyc-type",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "What are you verifying?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: type,
								onValueChange: setType,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									id: "kyc-type",
									className: "rounded-none text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: TYPES.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: t.value,
										children: t.label
									}, t.value))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "How do you want to file it?"
							}), [["file", "Fingerprint a document on this device"], ["reference", "I have a provider / registry reference"]].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex cursor-pointer items-center gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "kyc-mode",
									value,
									checked: mode === value,
									onChange: () => {
										setMode(value);
										setError(null);
									},
									className: "size-4 accent-foreground"
								}), label]
							}, value))]
						}),
						mode === "file" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "kyc-file",
									className: "font-mono text-[10px] uppercase tracking-[0.16em]",
									children: "Document"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "kyc-file",
									type: "file",
									accept: "image/*,.pdf",
									className: "rounded-none text-xs",
									onChange: (e) => void onFile(e.target.files?.[0] ?? null)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground",
									"aria-live": "polite",
									children: hashing ? "Computing fingerprint…" : digest ? `SHA-256 ${digest.slice(0, 16)}… computed locally. The file is not uploaded.` : "The file never leaves your device."
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "kyc-ref",
								className: "font-mono text-[10px] uppercase tracking-[0.16em]",
								children: "Reference"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "kyc-ref",
								value: reference,
								onChange: (e) => setReference(e.target.value),
								placeholder: "provider://smile-id/job/…  or  registry://rdb/…",
								className: "rounded-none font-mono text-xs",
								autoComplete: "off"
							})]
						}),
						error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "border-2 border-foreground p-3 text-xs",
							children: error
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full gap-2 rounded-none font-mono text-xs uppercase",
							disabled: !evidenceRef || hashing || submit.isPending,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileCheckCorner, {
								className: "size-4",
								"aria-hidden": "true"
							}), submit.isPending ? "Submitting…" : "Submit for review"]
						})
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Your submissions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: kyc,
					children: (data) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DataTable, {
						caption: "Verification submissions",
						rows: data.verifications,
						rowKey: (v) => v.id,
						searchable: false,
						empty: "Nothing submitted yet.",
						initialSort: {
							key: "when",
							dir: "desc"
						},
						columns: [
							{
								key: "type",
								header: "Type",
								sort: (v) => v.verification_type,
								cell: (v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs capitalize",
									children: v.verification_type
								})
							},
							{
								key: "ref",
								header: "Reference",
								text: (v) => v.reference,
								cell: (v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono text-xs text-muted-foreground",
									children: [v.reference.slice(0, 28), "…"]
								})
							},
							{
								key: "when",
								header: "Submitted",
								sort: (v) => v.created_at,
								cell: (v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular font-mono text-xs",
									children: when(v.created_at)
								})
							},
							{
								key: "status",
								header: "Status",
								align: "right",
								sort: (v) => v.status,
								cell: (v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: v.status === "verified" ? "invert" : v.status === "pending" ? "live" : "warn",
									children: v.status
								})
							}
						]
					})
				})
			})]
		})
	] });
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "trader",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Verification, {})
});
//#endregion
export { SplitComponent as component };
