import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Users, Plus, Trash2, Edit2, Check, UserCheck, Shield } from 'lucide-react';

export const AccountManagerModal = () => {
  const { 
    isAccountModalOpen, 
    setIsAccountModalOpen, 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount,
    activeAccountId,
    handleSelectAccount
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  if (!isAccountModalOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addAccount(newName.trim(), newUsername.trim(), newPhone.trim());
    setNewName('');
    setNewUsername('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleStartEdit = (acc) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditUsername(acc.username || '');
  };

  const handleSaveEdit = (accId) => {
    updateAccount(accId, { name: editName.trim(), username: editUsername.trim() });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Quản Lý Danh Sách Tài Khoản</h3>
              <p className="text-xs text-slate-400">Thêm hoặc đổi tên người mua để phân loại đơn hàng</p>
            </div>
          </div>

          <button
            onClick={() => setIsAccountModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tài khoản hiện có ({accounts.length})
            </span>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm người mua mới
              </button>
            )}
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200 space-y-3">
              <div className="text-xs font-bold text-orange-900">Thông tin tài khoản mới</div>
              
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Tên hiển thị (ví dụ: Tài khoản Johnny, Em gái...)</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nhập tên gọi dễ nhớ"
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Username Shopee (tùy chọn)</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="shopee_username"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">Số điện thoại (tùy chọn)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="098***"
                    className="w-full text-xs p-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Lưu tài khoản
                </button>
              </div>
            </form>
          )}

          {/* List of accounts */}
          <div className="space-y-2.5">
            {accounts.map((acc) => {
              const isEditing = editingId === acc.id;
              const isSelected = activeAccountId === acc.id;

              return (
                <div
                  key={acc.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-orange-50/40 border-orange-300 ring-1 ring-orange-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                        placeholder="Tên hiển thị"
                      />
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-28 text-xs p-1.5 bg-white border border-slate-300 rounded-lg"
                        placeholder="Username"
                      />
                      <button
                        onClick={() => handleSaveEdit(acc.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                        👤
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                          {acc.name}
                          {isSelected && (
                            <span className="text-[10px] font-bold bg-orange-600 text-white px-1.5 py-0.2 rounded-md">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {acc.username ? `@${acc.username}` : 'Chưa nhập username'} {acc.phone ? ` • ${acc.phone}` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelectAccount(acc.id)}
                        title="Xem đơn tài khoản này"
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold"
                      >
                        Chọn
                      </button>
                      <button
                        onClick={() => handleStartEdit(acc)}
                        title="Chỉnh sửa tên"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {accounts.length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa tài khoản "${acc.name}"?`)) {
                              deleteAccount(acc.id);
                            }
                          }}
                          title="Xóa tài khoản"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsAccountModalOpen(false)}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
