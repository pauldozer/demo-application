import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, Button, Table, Tag, Space, Typography,
  Select, Input, Modal, Popconfirm, App, Empty
} from 'antd';
import {
  UploadOutlined, InboxOutlined, DeleteOutlined,
  DownloadOutlined, EyeOutlined, FileTextOutlined,
  FileImageOutlined, FileUnknownOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { filesApi } from '../../api/files.api';
import { useAuth } from '../../context/AuthContext';

const { Text }  = Typography;
const { Dragger } = Upload;

const FILE_TYPES = [
  { value: 'lab',     label: 'Lab Result' },
  { value: 'imaging', label: 'Imaging / Scan' },
  { value: 'report',  label: 'Report' },
  { value: 'other',   label: 'Other' },
];

const CATEGORIES = [
  'Blood Work', 'Urine Analysis', 'Stool Analysis',
  'Chest X-Ray', 'Abdominal Ultrasound', 'CT Scan', 'MRI', 'Echocardiogram', 'ECG',
  'Dermatology', 'Ophthalmology', 'Pathology', 'Endoscopy', 'Colonoscopy',
  'Referral Letter', 'Discharge Summary', 'Prescription', 'Other'
];

function fileIcon(mimeType) {
  if (!mimeType) return <FileUnknownOutlined />;
  if (mimeType === 'application/pdf')      return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
  if (mimeType.startsWith('image/'))       return <FileImageOutlined style={{ color: '#1677ff' }} />;
  return <FileUnknownOutlined />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)       return `${bytes}B`;
  if (bytes < 1024**2)    return `${(bytes/1024).toFixed(1)}KB`;
  return `${(bytes/1024**2).toFixed(1)}MB`;
}

export default function FileManager({ patientId }) {
  const { user }               = useAuth();
  const { message }            = App.useApp();
  const [files, setFiles]      = useState([]);
  const [loading, setLoading]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [fileType,    setFileType]    = useState('lab');
  const [category,    setCategory]    = useState(undefined);
  const [description, setDescription] = useState('');
  const [fileList,    setFileList]    = useState([]);

  const canDelete = ['doctor', 'admin'].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try { setFiles(await filesApi.listForPatient(patientId)); }
    catch { message.error('Failed to load files'); }
    finally { setLoading(false); }
  }, [patientId, message]);

  useEffect(() => { load(); }, [load]);

  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    const formData = new FormData();
    formData.append('file',        file);
    formData.append('patient_id',  patientId);
    formData.append('file_type',   fileType);
    if (category)    formData.append('category',    category);
    if (description) formData.append('description', description);

    try {
      const result = await filesApi.upload(formData, (pct) => onProgress({ percent: pct }));
      onSuccess(result);
    } catch (err) {
      onError(err);
    }
  };

  const handleUploadChange = (info) => {
    setFileList(info.fileList);
    const done = info.fileList.filter(f => f.status === 'done');
    if (done.length > 0 && done.length === info.fileList.length) {
      message.success(`${done.length} file${done.length > 1 ? 's' : ''} uploaded`);
      setShowUpload(false);
      setFileList([]);
      setDescription('');
      load();
    }
    const failed = info.fileList.filter(f => f.status === 'error');
    if (failed.length > 0) {
      message.error(`Failed to upload: ${failed.map(f => f.name).join(', ')}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await filesApi.delete(id);
      message.success('File deleted');
      load();
    } catch {
      message.error('Failed to delete file');
    }
  };

  const columns = [
    {
      title: 'File',
      key: 'file',
      render: (_, r) => (
        <Space>
          {fileIcon(r.mime_type)}
          <div>
            <div style={{ fontWeight: 500, fontSize: 13 }}>{r.original_name}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatSize(r.file_size_bytes)}
              {r.description && ` · ${r.description}`}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Type',
      key: 'type',
      width: 110,
      render: (_, r) => {
        const typeColor = { lab:'blue', imaging:'geekblue', report:'purple', other:'default' };
        return (
          <Space direction="vertical" size={2}>
            <Tag color={typeColor[r.file_type]}>{r.file_type}</Tag>
            {r.category && <Text style={{ fontSize: 11, color: '#888' }}>{r.category}</Text>}
          </Space>
        );
      }
    },
    {
      title: 'Date',
      dataIndex: 'uploaded_at',
      width: 110,
      render: (v) => (
        <Text style={{ fontSize: 13 }}>{dayjs(v).format('DD/MM/YYYY')}</Text>
      )
    },
    {
      title: 'Uploaded by',
      dataIndex: 'uploaded_by_name',
      width: 130,
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button
            type="text" size="small" icon={<EyeOutlined />}
            onClick={() => window.open(filesApi.downloadUrl(r.id), '_blank')}
            title="View"
          />
          <Button
            type="text" size="small" icon={<DownloadOutlined />}
            href={filesApi.downloadUrl(r.id)}
            download={r.original_name}
            title="Download"
          />
          {canDelete && (
            <Popconfirm
              title="Delete this file?"
              onConfirm={() => handleDelete(r.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} title="Delete" />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setShowUpload(true)}
        >
          Upload File
        </Button>
      </div>

      {files.length === 0 && !loading ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No files uploaded yet" />
      ) : (
        <Table
          dataSource={files}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      )}

      {/* ── Upload modal ── */}
      <Modal
        open={showUpload}
        title="Upload Patient File"
        onCancel={() => { setShowUpload(false); setFileList([]); }}
        footer={null}
        width={540}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size={12}>
          <Space>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>File Type</div>
              <Select
                value={fileType}
                onChange={setFileType}
                options={FILE_TYPES}
                style={{ width: 160 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Category</div>
              <Select
                showSearch
                allowClear
                placeholder="e.g. Blood Work"
                value={category}
                onChange={setCategory}
                options={CATEGORIES.map(c => ({ value: c, label: c }))}
                style={{ width: 200 }}
              />
            </div>
          </Space>

          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Description (optional)</div>
            <Input
              placeholder="Brief description of this file…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <Dragger
            multiple
            fileList={fileList}
            customRequest={customRequest}
            onChange={handleUploadChange}
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif,.gif,.bmp,.webp"
            style={{ padding: '12px 0' }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text">Click or drag files here to upload</p>
            <p className="ant-upload-hint" style={{ fontSize: 12 }}>
              PDF, JPG, PNG, TIFF supported · Max 50MB per file
            </p>
          </Dragger>
        </Space>
      </Modal>
    </div>
  );
}
