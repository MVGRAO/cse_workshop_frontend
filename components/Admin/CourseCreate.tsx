'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { createCourse, getUsers, uploadImage } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseedit.module.scss';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CourseCreate() {
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifiers, setVerifiers] = useState<any[]>([]);
    const [showVerifierDropdown, setShowVerifierDropdown] = useState(false);

    /* =======================
       FORM STATE
    ======================== */
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');
    const [startTimestamp, setStartTimestamp] = useState('');
    const [endTimestamp, setEndTimestamp] = useState('');
    const [hasPractical, setHasPractical] = useState(false);
    const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    /* =======================
       MARKDOWN FORMATTERS
    ======================== */
    const applyInlineFormat = (before: string, after = before) => {
        const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = description.slice(start, end) || 'text';

        const updated =
            description.slice(0, start) +
            before +
            selected +
            after +
            description.slice(end);

        setDescription(updated);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selected.length
            );
        }, 0);
    };

    const applyHeading = (level: 1 | 2) => {
        const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const cursor = textarea.selectionStart;
        const lines = description.split('\n');

        let charCount = 0;
        const lineIndex = lines.findIndex(line => {
            charCount += line.length + 1;
            return charCount > cursor;
        });

        const headingPrefix = level === 1 ? '# ' : '## ';
        const currentLine = lines[lineIndex] || '';

        const cleanedLine = currentLine.replace(/^#{1,2}\s/, '');
        lines[lineIndex] = headingPrefix + cleanedLine;

        setDescription(lines.join('\n'));

        setTimeout(() => textarea.focus(), 0);
    };

    /* =======================
       FETCH VERIFIERS
    ======================== */
    useEffect(() => {
        const fetchVerifiers = async () => {
            try {
                const res = await getUsers('verifier');
                if (res.success) setVerifiers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchVerifiers();
    }, []);

    /* =======================
       IMAGE UPLOAD
    ======================== */
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await uploadImage(file);
            if (res.success) {
                setImageUrl(res.data.url);
                toast({ title: 'Success', description: 'Image uploaded successfully', variant: 'success' });
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Upload failed', variant: 'error' });
        } finally {
            setUploading(false);
        }
    };

    /* =======================
       SUBMIT HANDLER
    ======================== */
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !code.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Course title and code are required',
                variant: 'error'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                title,
                code: code.toUpperCase(),
                description,
                category,
                level,
                hasPracticalSession: hasPractical,
                verifiers: selectedVerifiers,
                startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : undefined,
                endTimestamp: endTimestamp ? new Date(endTimestamp).toISOString() : undefined,
                image: imageUrl,
            };

            const res = await createCourse(payload);

            if (res.success && res.data?._id) {
                toast({
                    title: 'Success',
                    description: 'Course created successfully',
                    variant: 'success'
                });
                router.push(`/admin/courses/${res.data._id}/edit`);
            }
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to create course',
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PrivateRoute allowedRoles={['admin']}>
            <div className={styles.container}>
                <div className={styles.wrapper}>
                    <div className={styles.courseForm}>
                        <h2 className={styles.formTitle}>Create New Course</h2>

                        <form onSubmit={handleCreate} className={styles.formSection}>
                            {/* TITLE */}
                            <div className={styles.formGroup}>
                                <label>Course Title *</label>
                                <input
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Introduction to React"
                                />
                            </div>

                            {/* CODE */}
                            <div className={styles.formGroup}>
                                <label>Course Code *</label>
                                <input
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    placeholder="CS101"
                                />
                            </div>

                            {/* IMAGE */}
                            <div className={styles.formGroup}>
                                <label>Course Cover Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                {uploading && <small>Uploading...</small>}
                                {imageUrl && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <img src={imageUrl} alt="Preview" style={{ maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} />
                                    </div>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div className={styles.formGroup}>
                                <label>Course Description</label>

                                <div className={styles.editorToolbar}>
                                    <button type="button" onClick={() => applyInlineFormat('**')}>B</button>
                                    <button type="button" onClick={() => applyInlineFormat('*')}>I</button>
                                    <button type="button" onClick={() => applyInlineFormat('`')}>Code</button>
                                    <button type="button" onClick={() => applyHeading(1)}>H1</button>
                                    <button type="button" onClick={() => applyHeading(2)}>H2</button>
                                    <button type="button" onClick={() => applyInlineFormat('- ', '')}>List</button>
                                </div>

                                <div className={styles.editorGrid}>
                                    <textarea
                                        id="description-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Write course description using Markdown..."
                                    />
                                    <div className={styles.markdownPreview}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {description || '_Live preview will appear here_'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>

                            {/* DATES */}
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date</label>
                                    <input type="date" value={startTimestamp} onChange={e => setStartTimestamp(e.target.value)} />
                                    <small>Format: DD-MM-YYYY</small>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>End Date</label>
                                    <input type="date" value={endTimestamp} onChange={e => setEndTimestamp(e.target.value)} />
                                    <small>Format: DD-MM-YYYY</small>
                                </div>
                            </div>

                            {/* PRACTICAL */}
                            <div className={styles.formGroup}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={hasPractical}
                                        onChange={e => setHasPractical(e.target.checked)}
                                    />
                                    Has Practical Session
                                </label>
                            </div>

                            {/* VERIFIERS */}
                            {verifiers.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label>Assign Verifiers</label>

                                    <div
                                        className={styles.multiSelect}
                                        onClick={() => setShowVerifierDropdown(!showVerifierDropdown)}
                                    >
                                        {selectedVerifiers.length
                                            ? `${selectedVerifiers.length} selected`
                                            : 'Select verifiers'}
                                        <span>▾</span>
                                    </div>

                                    {showVerifierDropdown && (
                                        <div className={styles.optionsBox}>
                                            {verifiers.map(v => (
                                                <label key={v._id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedVerifiers.includes(v._id)}
                                                        onChange={() =>
                                                            setSelectedVerifiers(prev =>
                                                                prev.includes(v._id)
                                                                    ? prev.filter(id => id !== v._id)
                                                                    : [...prev, v._id]
                                                            )
                                                        }
                                                    />
                                                    {v.name} ({v.email})
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    <small>You can select multiple verifiers</small>
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={styles.nextButton}
                                >
                                    {isSubmitting ? 'Creating…' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}
