"use client"

import { Checkbox, CheckboxIndicator } from "@ui-sdk/react/checkbox"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/react/slider"
import type { ComponentProps, Ref } from "react"

export function GalleryCheckbox({
  onCheckedChange,
  ...props
}: Omit<ComponentProps<typeof Checkbox>, "children" | "onCheckedChange"> & {
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Checkbox
      {...props}
      onCheckedChange={(checked) => onCheckedChange(checked === true)}
    >
      <CheckboxIndicator aria-hidden="true">✓</CheckboxIndicator>
    </Checkbox>
  )
}

export function GallerySelect<T extends string | number>({
  label,
  options,
  value,
  onValueChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onValueChange: (value: T) => void
}) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next)
      }}
    >
      <SelectTrigger aria-label={label} className="gallery-select">
        <SelectValue />
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
          <path
            d="m2 4 4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </SelectTrigger>
      <SelectContent className="gallery-options" align="start" sideOffset={4} />
    </Select>
  )
}

export function GallerySlider({
  label,
  describedBy,
  sliderRef,
  ...props
}: Pick<
  ComponentProps<typeof Slider<number>>,
  "min" | "max" | "step" | "largeStep" | "value" | "onValueChange" | "format"
> & {
  label: string
  describedBy?: string
  sliderRef?: Ref<HTMLDivElement>
}) {
  return (
    <Slider className="gallery-slider" ref={sliderRef} {...props}>
      <SliderControl>
        <SliderTrack>
          <SliderIndicator />
          <SliderThumb aria-label={label} aria-describedby={describedBy} />
        </SliderTrack>
      </SliderControl>
    </Slider>
  )
}
