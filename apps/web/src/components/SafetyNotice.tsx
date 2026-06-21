import { ShieldCheck } from "lucide-react";

export function SafetyNotice() {
  return (
    <div className="rounded-lg border border-panel-border bg-black/20 p-4">
      <div className="flex items-center gap-2 font-medium">
        <ShieldCheck className="size-4 text-meter-green" />
        {"\u5185\u5bb9\u5408\u89c4\u63d0\u793a"}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {
          "\u8bf7\u4f7f\u7528\u201c\u4e2d\u6587\u6d41\u884c\u201d\u3001\u201cR&B\u201d\u3001\u201c\u56fd\u98ce\u201d\u3001\u201c\u5973\u58f0\u201d\u3001\u201c\u57ce\u5e02\u591c\u8272\u611f\u201d\u7b49\u901a\u7528\u63cf\u8ff0\uff0c\u4e0d\u8981\u8981\u6c42\u6a21\u4eff\u771f\u5b9e\u6b4c\u624b\u3001\u771f\u5b9e\u6b4c\u66f2\u3001\u660e\u661f\u58f0\u97f3\u6216\u590d\u5236\u7248\u6743\u6b4c\u8bcd\u3002"
        }
      </p>
    </div>
  );
}
