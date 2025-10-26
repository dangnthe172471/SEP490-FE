import Swal from 'sweetalert2';

// Cấu hình mặc định cho SweetAlert2
const defaultConfig = {
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#6b7280',
    allowOutsideClick: false,
    allowEscapeKey: true,
    showCloseButton: true,
    focusConfirm: true,
    reverseButtons: true,
};

// Thông báo thành công
export const showSuccessAlert = (title: string, text?: string, timer?: number) => {
    return Swal.fire({
        ...defaultConfig,
        icon: 'success',
        title,
        text,
        confirmButtonText: 'Tiếp tục',
        confirmButtonColor: '#10b981',
        timer: timer || 3000,
        timerProgressBar: true,
        showConfirmButton: timer ? false : true, // Ẩn nút khi có timer
        allowOutsideClick: false, // Không cho click outside
        allowEscapeKey: false, // Không cho ESC
    });
};

// Thông báo lỗi thường
export const showErrorAlert = (title: string, text: string, timer?: number) => {
    return Swal.fire({
        ...defaultConfig,
        icon: 'error',
        title,
        text,
        confirmButtonText: 'Thử lại',
        confirmButtonColor: '#ef4444',
        timer: timer || 8000, // Tăng lên 8 giây
        timerProgressBar: true,
        allowOutsideClick: false, // Không cho click outside để đóng
        allowEscapeKey: false, // Không cho ESC để đóng
    });
    // Bỏ window.location.reload() để không reload trang
};

// Thông báo tài khoản bị khóa
export const showAccountLockedAlert = (message: string) => {
    return Swal.fire({
        ...defaultConfig,
        icon: 'error',
        title: 'Tài khoản bị khóa',
        html: `
      <div class="text-left">
        <p class="mb-3">${message}</p>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-sm font-semibold mb-2">Liên hệ hỗ trợ:</p>
          <p class="text-sm">📞 Điện thoại: 0123 456 789</p>
          <p class="text-sm">📧 Email: support@diamondhealth.com</p>
        </div>
      </div>
    `,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#ef4444',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
    });
    // Bỏ window.location.reload() để không reload trang
};

// Thông báo cảnh báo
export const showWarningAlert = (title: string, text: string, timer?: number) => {
    return Swal.fire({
        ...defaultConfig,
        icon: 'warning',
        title,
        text,
        confirmButtonText: 'Đã hiểu',
        confirmButtonColor: '#3b82f6',
        timer: timer || 6000, // Tăng lên 6 giây
        timerProgressBar: true,
        allowOutsideClick: false, // Không cho click outside để đóng
        allowEscapeKey: false, // Không cho ESC để đóng
    });
};

// Thông báo xác nhận
export const showConfirmAlert = (title: string, text: string) => {
    return Swal.fire({
        ...defaultConfig,
        icon: 'question',
        title,
        text,
        showCancelButton: true,
        confirmButtonText: 'Xác nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
    });
};

// Thông báo loading
export const showLoadingAlert = (title: string = 'Đang xử lý...') => {
    Swal.fire({
        title,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

// Đóng thông báo loading
export const closeLoadingAlert = () => {
    Swal.close();
};
