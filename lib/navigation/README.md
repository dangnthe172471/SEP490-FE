# Navigation System

Hệ thống navigation tập trung cho tất cả các role trong ứng dụng.

## Cấu trúc

```
lib/navigation/
├── index.ts              # Export tất cả navigation
├── types.ts              # Interface chung
├── doctor-navigation.ts  # Navigation cho bác sĩ
├── manager-navigation.ts # Navigation cho quản lý
├── reception-navigation.ts # Navigation cho lễ tân
├── nurse-navigation.ts   # Navigation cho y tá
├── admin-navigation.ts   # Navigation cho admin
└── pharmacy-navigation.ts # Navigation cho dược sĩ
```

## Sử dụng

### Import navigation cho role cụ thể

```typescript
import { getDoctorNavigation } from "@/lib/navigation/doctor-navigation"
// hoặc
import { getDoctorNavigation } from "@/lib/navigation"

// Trong component
const navigation = getDoctorNavigation()
```

### Import tất cả navigation

```typescript
import { 
  getDoctorNavigation,
  getManagerNavigation,
  getReceptionNavigation,
  getNurseNavigation,
  getAdminNavigation,
  getPharmacyNavigation
} from "@/lib/navigation"
```

## Các Role Navigation

### 1. Doctor (Bác sĩ)
- Tổng quan
- Bệnh nhân
- Hồ sơ bệnh án
- Lịch hẹn
- Chi tiết khám
- Đổi ca

### 2. Manager (Quản lý)
- Tổng quan
- Lịch hẹn
- Báo cáo
- Lịch làm việc
- Lịch phòng khám
- Yêu cầu đổi ca
- Phân tích
- Loại xét nghiệm
- Phòng khám
- Thuốc

### 3. Reception (Lễ tân)
- Tổng quan
- Lịch hẹn
- Xem lịch
- Bệnh nhân
- Hồ sơ bệnh án
- Chat hỗ trợ
- Đăng ký mới

### 4. Nurse (Y tá)
- Tổng quan
- Bệnh nhân
- Nhiệm vụ
- Theo dõi

### 5. Admin (Quản trị)
- Tổng quan
- Người dùng
- Phân quyền
- Cài đặt

### 6. Pharmacy (Dược sĩ)
- Tổng quan
- Đơn thuốc
- Kho thuốc
- Thuốc

## Lợi ích

- **Tập trung**: Tất cả navigation ở một nơi
- **Nhất quán**: UI/UX đồng nhất giữa các trang
- **Dễ bảo trì**: Thay đổi ở một nơi, áp dụng mọi nơi
- **Type Safety**: TypeScript support đầy đủ
- **Tái sử dụng**: Có thể import và sử dụng ở bất kỳ đâu
