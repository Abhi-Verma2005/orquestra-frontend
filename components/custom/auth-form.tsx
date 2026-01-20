import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function AuthForm({
  action,
  children,
  defaultEmail = "",
}: {
  action: any;
  children: React.ReactNode;
  defaultEmail?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5 px-4 sm:px-8">
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-[13px] text-muted-foreground/80"
          >
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            className="h-11 rounded-lg border-border/30 bg-[#0C0C0D] text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:border-border/50 focus:ring-0"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            defaultValue={defaultEmail}
          />
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-[13px] text-muted-foreground/80"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            className="h-11 rounded-lg border-border/30 bg-[#0C0C0D] text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:border-border/50 focus:ring-0"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>
      </div>

      {children}
    </form>
  );
}
