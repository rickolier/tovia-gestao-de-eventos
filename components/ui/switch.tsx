import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

/*
  Toggle padrão do Tovia (referência aprovada): thumb branco grande que
  transborda a trilha, com sombra. Ligado = verde, desligado = cinza.
*/
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full outline-none transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "data-checked:bg-toggle-on data-unchecked:bg-toggle-off",
        "data-[size=default]:h-7 data-[size=default]:w-[52px]",
        "data-[size=sm]:h-5 data-[size=sm]:w-[38px]",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform",
          "group-data-[size=default]/switch:size-[34px] group-data-[size=default]/switch:data-unchecked:-translate-x-[3px] group-data-[size=default]/switch:data-checked:translate-x-[21px]",
          "group-data-[size=sm]/switch:size-[24px] group-data-[size=sm]/switch:data-unchecked:-translate-x-[2px] group-data-[size=sm]/switch:data-checked:translate-x-[16px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
