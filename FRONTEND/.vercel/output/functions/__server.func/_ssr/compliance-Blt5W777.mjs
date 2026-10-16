import { i as __toESM } from "../_runtime.mjs";
import { i as compliance, o as describeError } from "./endpoints-Dhw-Uhtx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@radix-ui/react-accordion+[...].mjs";
import { t as Button } from "./dropdown-menu-WnKjXFQ9.mjs";
import { a as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Input } from "./input-Lx3Itb5F.mjs";
import { i as QueryBoundary } from "./query-state-38NEt_Mf.mjs";
import { a as DialogFooter, c as Metric, d as Shell, i as DialogDescription, l as PageHeader, n as Dialog, o as DialogHeader, r as DialogContent, s as DialogTitle, t as Chip, u as Panel } from "./shell-TFIi8X1Z.mjs";
import { o as shortId, u as when } from "./format-DmZ5-Nei.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as LazyDonutChart } from "./lazy-charts-CUzwBwkB.mjs";
import { t as Label } from "./label-B471Uw28.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D0Mx5SvU.mjs";
import { t as Textarea } from "./textarea-BXgeF5np.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/compliance-Blt5W777.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ORG_TYPES = [
	"company",
	"sole_trader",
	"partnership",
	"cooperative",
	"nonprofit"
];
var VERIFICATION_TYPES = [
	"identity",
	"business",
	"address",
	"ownership"
];
var REVIEW_STATUSES = [
	"approved",
	"rejected",
	"suspended",
	"needs_information"
];
var VERIFICATION_DECISIONS = [
	"verified",
	"rejected",
	"expired"
];
var SEVERITIES = [
	"low",
	"medium",
	"high",
	"critical"
];
function tally(values) {
	const m = /* @__PURE__ */ new Map();
	for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
	return Array.from(m, ([label, value]) => ({
		label,
		value
	}));
}
var statusTone = (s) => [
	"approved",
	"verified",
	"resolved"
].includes(s) ? "invert" : [
	"rejected",
	"suspended",
	"expired",
	"critical",
	"high"
].includes(s) ? "warn" : "live";
function Compliance() {
	const qc = useQueryClient();
	const [tab, setTab] = (0, import_react.useState)("organizations");
	const orgs = useQuery({
		queryKey: ["orgs"],
		queryFn: compliance.organizations
	});
	const verifications = useQuery({
		queryKey: ["verifications"],
		queryFn: compliance.verifications
	});
	const reviews = useQuery({
		queryKey: ["reviews"],
		queryFn: compliance.reviews
	});
	const [orgOpen, setOrgOpen] = (0, import_react.useState)(false);
	const [openOrg, setOpenOrg] = (0, import_react.useState)(null);
	const [decide, setDecide] = (0, import_react.useState)(null);
	const [newVerification, setNewVerification] = (0, import_react.useState)(false);
	const [newReviewFor, setNewReviewFor] = (0, import_react.useState)(null);
	const refresh = () => {
		qc.invalidateQueries({ queryKey: ["orgs"] });
		qc.invalidateQueries({ queryKey: ["verifications"] });
		qc.invalidateQueries({ queryKey: ["reviews"] });
	};
	const orgName = (id) => orgs.data?.find((o) => o.id === id)?.legal_name ?? shortId(id);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			eyebrow: "Regulatory gateway",
			title: "Compliance & KYC",
			description: "Verification is proportionate to exposure. Every decision records who made it, from which state to which, and why — the log is append-only.",
			actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				onClick: () => setNewVerification(true),
				className: "rounded-none font-mono text-xs uppercase",
				children: "Submit evidence"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setOrgOpen(true),
				className: "rounded-none font-mono text-xs uppercase",
				children: "New organization"
			})] })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 sm:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Organizations",
					value: orgs.data?.length ?? "—",
					sub: `${orgs.data?.filter((o) => o.verification_status === "approved").length ?? 0} approved`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Pending verifications",
					value: verifications.data?.filter((v) => v.status === "pending").length ?? "—",
					sub: "Evidence awaiting a decision"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
					label: "Open reviews",
					value: reviews.data?.filter((r) => r.status === "pending").length ?? "—",
					sub: "Compliance cases in flight"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Verification evidence · by status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: tally((verifications.data ?? []).map((v) => v.status)),
					ariaLabel: "Verification evidence by status",
					center: {
						value: String(verifications.data?.length ?? 0),
						label: "items"
					},
					format: (v) => String(v)
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Organizations · by verification status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyDonutChart, {
					data: tally((orgs.data ?? []).map((o) => o.verification_status)),
					ariaLabel: "Organizations by verification status",
					center: {
						value: String(orgs.data?.length ?? 0),
						label: "organizations"
					},
					format: (v) => String(v)
				})
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Register",
			meta: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1.5",
				children: [
					"organizations",
					"verifications",
					"reviews"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setTab(t),
					className: "cursor-pointer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
						tone: tab === t ? "invert" : "neutral",
						children: t
					})
				}, t))
			}),
			children: tab === "organizations" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: orgs,
				isEmpty: (d) => d.length === 0,
				empty: "No organizations yet. Create one to start a review.",
				children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
					head: [
						"Organization",
						"Country",
						"Type",
						"Registration",
						"Status"
					],
					children: rows.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						onClick: () => setOpenOrg(o),
						className: "cursor-pointer border-b border-border/60 last:border-0 hover:bg-accent/40",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5",
								children: o.legal_name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 font-mono text-xs",
								children: o.country_code
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 font-mono text-xs",
								children: o.organization_type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 font-mono text-xs text-muted-foreground",
								children: o.registration_number ?? "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: statusTone(o.verification_status),
									children: o.verification_status
								})
							})
						]
					}, o.id))
				})
			}) : tab === "verifications" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: verifications,
				isEmpty: (d) => d.length === 0,
				empty: "No verification evidence submitted.",
				children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
					head: [
						"Subject",
						"Type",
						"Reference",
						"Submitted",
						"Status",
						""
					],
					children: rows.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-xs",
								children: v.organization_id ? orgName(v.organization_id) : `trader ${shortId(v.user_id)}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 font-mono text-xs",
								children: v.verification_type
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 font-mono text-xs text-muted-foreground",
								children: v.reference
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2.5 font-mono text-xs text-muted-foreground",
								children: [
									when(v.created_at),
									" · ",
									v.submitted_by
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: statusTone(v.status),
									children: v.status
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-right",
								children: v.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									className: "h-7 rounded-none font-mono text-[10px] uppercase",
									onClick: () => setDecide({
										kind: "verification",
										id: v.id
									}),
									children: "Decide"
								}) : null
							})
						]
					}, v.id))
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
				query: reviews,
				isEmpty: (d) => d.length === 0,
				empty: "No compliance reviews opened.",
				children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Table, {
					head: [
						"Organization",
						"Reason",
						"Opened",
						"Status",
						""
					],
					children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-xs",
								children: orgName(r.organization_id)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "max-w-xs truncate py-2.5 text-xs",
								children: r.reason
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "py-2.5 font-mono text-xs text-muted-foreground",
								children: [
									when(r.created_at),
									" · ",
									r.opened_by
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
									tone: statusTone(r.status),
									children: r.status
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "py-2.5 text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									className: "h-7 rounded-none font-mono text-[10px] uppercase",
									onClick: () => setDecide({
										kind: "review",
										id: r.id
									}),
									children: "Decide"
								})
							})
						]
					}, r.id))
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrgDialog, {
			open: orgOpen,
			onOpenChange: setOrgOpen,
			onDone: refresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrgDetail, {
			org: openOrg,
			onClose: () => setOpenOrg(null),
			onOpenReview: (id) => setNewReviewFor(id)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DecisionDialog, {
			target: decide,
			onClose: () => setDecide(null),
			onDone: refresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(VerificationDialog, {
			open: newVerification,
			onOpenChange: setNewVerification,
			orgs: orgs.data ?? [],
			onDone: refresh
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewDialog, {
			orgId: newReviewFor,
			onClose: () => setNewReviewFor(null),
			onDone: refresh
		})
	] });
}
function Table({ head, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "overflow-x-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full min-w-[760px] text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				className: "border-b border-border text-left font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground",
				children: head.map((h, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: `py-2 ${i >= head.length - 2 ? "text-right" : ""}`,
					children: h
				}, i))
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children })]
		})
	});
}
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "font-mono text-[10px] uppercase tracking-[0.16em]",
			children: label
		}), children]
	});
}
function Pick({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
		value,
		onValueChange: onChange,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
			"aria-label": "Choose an option",
			className: "rounded-none font-mono text-xs",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
			className: "rounded-none",
			children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: o,
				children: o
			}, o))
		})]
	});
}
function OrgDialog({ open, onOpenChange, onDone }) {
	const [f, setF] = (0, import_react.useState)({
		legal_name: "",
		trading_name: "",
		country_code: "RW",
		organization_type: "company",
		registration_number: ""
	});
	const create = useMutation({
		mutationFn: () => compliance.createOrganization({
			legal_name: f.legal_name.trim(),
			country_code: f.country_code.trim().toUpperCase(),
			organization_type: f.organization_type,
			...f.trading_name.trim() ? { trading_name: f.trading_name.trim() } : {},
			...f.registration_number.trim() ? { registration_number: f.registration_number.trim() } : {}
		}),
		onSuccess: (o) => {
			toast.success(`${o.legal_name} created`);
			onDone();
			onOpenChange(false);
		},
		onError: (e) => toast.error(describeError(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-lg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "New organization"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Legal entity subject to verification." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Legal name",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none",
								value: f.legal_name,
								onChange: (e) => setF({
									...f,
									legal_name: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Trading name (optional)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none",
								value: f.trading_name,
								onChange: (e) => setF({
									...f,
									trading_name: e.target.value
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Country (ISO-2)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									maxLength: 2,
									className: "rounded-none font-mono",
									value: f.country_code,
									onChange: (e) => setF({
										...f,
										country_code: e.target.value
									})
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
									value: f.organization_type,
									onChange: (v) => setF({
										...f,
										organization_type: v
									}),
									options: ORG_TYPES
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Registration number (optional)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								value: f.registration_number,
								onChange: (e) => setF({
									...f,
									registration_number: e.target.value
								})
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !f.legal_name.trim() || f.country_code.length !== 2 || create.isPending,
					onClick: () => create.mutate(),
					children: "Create"
				}) })
			]
		})
	});
}
function OrgDetail({ org, onClose, onOpenReview }) {
	const qc = useQueryClient();
	const flags = useQuery({
		queryKey: ["flags", org?.id],
		queryFn: () => compliance.riskFlags(org.id),
		enabled: !!org
	});
	const [code, setCode] = (0, import_react.useState)("");
	const [severity, setSeverity] = (0, import_react.useState)("medium");
	const [desc, setDesc] = (0, import_react.useState)("");
	const add = useMutation({
		mutationFn: () => compliance.addRiskFlag(org.id, {
			code: code.trim().toUpperCase(),
			severity,
			description: desc.trim()
		}),
		onSuccess: () => {
			toast.success("Risk flag raised");
			setCode("");
			setDesc("");
			qc.invalidateQueries({ queryKey: ["flags", org?.id] });
		},
		onError: (e) => toast.error(describeError(e))
	});
	const resolve = useMutation({
		mutationFn: (flagId) => compliance.resolveRiskFlag(org.id, flagId, "Resolved by operator review"),
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["flags", org?.id] }),
		onError: (e) => toast.error(describeError(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: org !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
			className: "max-h-[90vh] overflow-y-auto rounded-none sm:max-w-2xl",
			children: org ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: org.legal_name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, { children: [
					org.country_code,
					" · ",
					org.organization_type,
					" · ",
					org.verification_status
				] })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						className: "rounded-none font-mono text-[10px] uppercase",
						onClick: () => onOpenReview(org.id),
						children: "Open compliance review"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground",
					children: "Risk flags"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryBoundary, {
					query: flags,
					isEmpty: (d) => d.length === 0,
					empty: "No risk flags.",
					children: (rows) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "divide-y divide-border border border-border",
						children: rows.map((fl) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-start justify-between gap-3 px-3 py-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs",
										children: fl.code
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: statusTone(fl.severity),
										children: fl.severity
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chip, {
										tone: statusTone(fl.status),
										children: fl.status
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: fl.description
							})] }), fl.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								className: "h-7 rounded-none font-mono text-[10px] uppercase",
								disabled: resolve.isPending,
								onClick: () => resolve.mutate(fl.id),
								children: "Resolve"
							}) : null]
						}, fl.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-2 sm:grid-cols-[1fr_140px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						className: "rounded-none font-mono",
						placeholder: "Flag code e.g. VOLUME_SPIKE",
						value: code,
						onChange: (e) => setCode(e.target.value)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
						value: severity,
						onChange: setSeverity,
						options: SEVERITIES
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-16 rounded-none",
					placeholder: "Describe the concern…",
					value: desc,
					onChange: (e) => setDesc(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !code.trim() || !desc.trim() || add.isPending,
					onClick: () => add.mutate(),
					children: "Raise flag"
				})
			] }) : null
		})
	});
}
function DecisionDialog({ target, onClose, onDone }) {
	const options = target?.kind === "verification" ? VERIFICATION_DECISIONS : REVIEW_STATUSES;
	const [status, setStatus] = (0, import_react.useState)("");
	const [rationale, setRationale] = (0, import_react.useState)("");
	const chosen = status || options[0] || "";
	const decide = useMutation({
		mutationFn: async () => {
			if (target.kind === "verification") await compliance.decideVerification(target.id, chosen, rationale.trim());
			else await compliance.decideReview(target.id, chosen, rationale.trim());
		},
		onSuccess: () => {
			toast.success("Decision recorded");
			setRationale("");
			setStatus("");
			onDone();
			onClose();
		},
		onError: (e) => toast.error("Decision refused", { description: describeError(e) })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: target !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Record decision"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "The rationale is stored with the state change and cannot be edited." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Outcome",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
							value: chosen,
							onChange: setStatus,
							options
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Rationale",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
							className: "min-h-24 rounded-none",
							value: rationale,
							onChange: (e) => setRationale(e.target.value)
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !rationale.trim() || decide.isPending,
					onClick: () => decide.mutate(),
					children: "Record"
				}) })
			]
		})
	});
}
function VerificationDialog({ open, onOpenChange, orgs, onDone }) {
	const [orgId, setOrgId] = (0, import_react.useState)("");
	const [type, setType] = (0, import_react.useState)("identity");
	const [reference, setReference] = (0, import_react.useState)("");
	const [label, setLabel] = (0, import_react.useState)("");
	const create = useMutation({
		mutationFn: () => compliance.createVerification({
			organization_id: orgId || orgs[0].id,
			verification_type: type,
			reference: reference.trim(),
			...label.trim() ? { evidence_label: label.trim() } : {}
		}),
		onSuccess: () => {
			toast.success("Evidence recorded");
			setReference("");
			setLabel("");
			onDone();
			onOpenChange(false);
		},
		onError: (e) => toast.error(describeError(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Submit evidence"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Record a reference to evidence held elsewhere. Document contents are never uploaded here." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Organization",
							children: orgs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Create an organization first."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: orgId || orgs[0].id,
								onValueChange: setOrgId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
									"aria-label": "Organization",
									className: "rounded-none text-xs",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
									className: "rounded-none",
									children: orgs.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: o.id,
										children: o.legal_name
									}, o.id))
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Type",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pick, {
								value: type,
								onChange: setType,
								options: VERIFICATION_TYPES
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Reference",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none font-mono",
								value: reference,
								onChange: (e) => setReference(e.target.value),
								placeholder: "Certificate / document reference"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Label (optional)",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								className: "rounded-none",
								value: label,
								onChange: (e) => setLabel(e.target.value)
							})
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: orgs.length === 0 || !reference.trim() || create.isPending,
					onClick: () => create.mutate(),
					children: "Submit"
				}) })
			]
		})
	});
}
function ReviewDialog({ orgId, onClose, onDone }) {
	const [reason, setReason] = (0, import_react.useState)("");
	const create = useMutation({
		mutationFn: () => compliance.createReview(orgId, reason.trim()),
		onSuccess: () => {
			toast.success("Review opened");
			setReason("");
			onDone();
			onClose();
		},
		onError: (e) => toast.error(describeError(e))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: orgId !== null,
		onOpenChange: (o) => !o && onClose(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "rounded-none sm:max-w-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "font-mono text-sm uppercase tracking-[0.18em]",
					children: "Open compliance review"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Describe why this organization needs review." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					className: "min-h-24 rounded-none",
					value: reason,
					onChange: (e) => setReason(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "rounded-none font-mono text-xs uppercase",
					disabled: !reason.trim() || create.isPending,
					onClick: () => create.mutate(),
					children: "Open review"
				}) })
			]
		})
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {
	role: "operator",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compliance, {})
});
//#endregion
export { SplitComponent as component };
