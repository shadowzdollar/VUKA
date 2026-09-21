import { Languages, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES, useI18n, useT, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/** Language menu + theme toggle, for pages that don't carry the full site header. */
export function SiteControls() {
  const t = useT();
  const { lang, setLang } = useI18n();
  const { resolved, setPreference } = useTheme();
  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 rounded-none font-mono text-[11px] uppercase"
            aria-label={t("shell.language")}
          >
            <Languages className="size-4" aria-hidden="true" /> {lang}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-none">
          <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
            {LANGUAGES.map((l) => (
              <DropdownMenuRadioItem key={l.code} value={l.code}>
                {l.native}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 rounded-none"
        aria-label={t("shell.theme")}
        onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
      >
        {resolved === "dark" ? (
          <Sun className="size-4" aria-hidden="true" />
        ) : (
          <Moon className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
