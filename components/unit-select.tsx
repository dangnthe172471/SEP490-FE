"use client"

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// sentinel cho "không có đơn vị"
const NO_UNIT_VALUE = "__no_unit__"

// Các đơn vị thường gặp – tùy bạn thêm/bớt
export const TEST_UNITS: string[] = [
  "%",

  // Huyết học
  "g/dL",
  "g/L",
  "mg/dL",
  "x10^9/L",
  "x10^12/L",
  "fL",
  "pg",

  // Sinh hoá
  "mmol/L",
  "μmol/L",
  "U/L",
  "IU/L",
  "mEq/L",
  "ng/mL",
  "μg/L",
  "mg/L",

  // Nước tiểu / dịch
  "cells/μL",
  "cells/HPF",
  "mL/min/1.73m²",

  // Khác
  "kg/m²",
  "cm",
  "mmHg",
]

type UnitSelectProps = {
  label?: string
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export function UnitSelect({
  label = "Đơn vị",
  value,
  onChange,
  placeholder = "Chọn đơn vị",
  required,
}: UnitSelectProps) {
  // nếu value trống -> dùng sentinel để Select không bị lỗi
  const stringValue =
    value && value.trim().length > 0 ? value : NO_UNIT_VALUE

  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Select
        value={stringValue}
        onValueChange={(v) => {
          if (v === NO_UNIT_VALUE) {
            onChange("") // map lại thành không đơn vị
          } else {
            onChange(v)
          }
        }}
      >
        <SelectTrigger className="bg-slate-50 hover:bg-slate-100">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {/* Option không đơn vị */}
          <SelectItem value={NO_UNIT_VALUE}>(Không có đơn vị)</SelectItem>

          {TEST_UNITS.map((u) => (
            <SelectItem key={u} value={u}>
              {u}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
