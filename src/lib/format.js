export function dateTime(value) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '—'
}

export const loanStatus = {
  active: '借阅中',
  returned: '已归还',
  expired: '已到期',
  admin_ended: '管理员结束',
}

export const renewalStatus = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已失效',
}
