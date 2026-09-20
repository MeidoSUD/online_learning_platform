import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function WithdrawalMethods({ methods }) {
    const { post } = useForm();

    const handleToggle = (id) => {
        post(route('admin.withdrawal-methods.toggle', id), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="طرق السحب" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h2 className="text-2xl font-bold mb-6">إدارة طرق السحب</h2>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-right">طريقة السحب</th>
                                            <th className="px-6 py-3 text-right">الحالة</th>
                                            <th className="px-6 py-3 text-right">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {methods.map((method) => (
                                            <tr key={method.id} className="bg-white border-b">
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                    {method.name_ar}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {method.is_active ? 'مفعل' : 'معطل'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleToggle(method.id)}
                                                        className={`px-4 py-2 rounded-md text-white text-sm ${method.is_active ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                                    >
                                                        {method.is_active ? 'تعطيل' : 'تفعيل'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
