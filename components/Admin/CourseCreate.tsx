'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PrivateRoute from '@/components/PrivateRoute';
import { createCourse, getUsers } from '@/lib/api';
import { useToast } from '@/components/common/ToastProvider';
import styles from '@/styles/courseedit.module.scss'; // Reuse edit styles
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


export default function CourseCreate() {
    const router = useRouter();
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifiers, setVerifiers] = useState<any[]>([]);
    const [showVerifierDropdown, setShowVerifierDropdown] = useState(false);
    const applyFormat = (before: string, after: string = before) => {
        const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = description.slice(start, end) || 'text';

        const newText =
            description.slice(0, start) +
            before +
            selectedText +
            after +
            description.slice(end);

        setDescription(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selectedText.length
            );
        }, 0);
    };



    // Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('beginner');
    const [startTimestamp, setStartTimestamp] = useState('');
    const [endTimestamp, setEndTimestamp] = useState('');
    const [hasPractical, setHasPractical] = useState(false);
    const [selectedVerifiers, setSelectedVerifiers] = useState<string[]>([]);

    useEffect(() => {
        // Fetch verifiers for selection
        const fetchVerifiers = async () => {
            try {
                const response = await getUsers('verifier');
                if (response.success) {
                    setVerifiers(response.data);
                }
            } catch (error) {
                console.error('Failed to load verifiers:', error);
            }
        };
        fetchVerifiers();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !code.trim()) {
            toast({ title: 'Validation Error', description: 'Title and Code are required', variant: 'error' });
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
            };

            const response = await createCourse(payload);

            if (response.success && response.data?._id) {
                toast({ title: 'Success', description: 'Course created successfully!', variant: 'success' });
                // Redirect to edit page to add content
                router.push(`/admin/courses/${response.data._id}/edit`);
            }
        } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to create course', variant: 'error' });
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
                            <div className={styles.formGroup}>
                                <label>Course Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="e.g. Introduction to React"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Course Code *</label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={e => setCode(e.target.value.toUpperCase())}
                                    required
                                    placeholder="e.g. CS101"
                                />
                            </div>
                            {/* 
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className={styles.textarea}
                                    placeholder="Course description..."
                                />
                            </div> */}
                            <div className={styles.formGroup}>
                                <label>Description</label>

                                {/* Toolbar */}
                                <div className={styles.editorToolbar}>
                                    <button type="button" onClick={() => applyFormat('**', '**')}><b>B</b></button>
                                    <button type="button" onClick={() => applyFormat('*', '*')}><i>I</i></button>
                                    <button type="button" onClick={() => applyFormat('`', '`')}>Code</button>
                                    <button type="button" onClick={() => applyFormat('# ', '')}>H1</button>
                                    <button type="button" onClick={() => applyFormat('## ', '')}>H2</button>
                                    <button type="button" onClick={() => applyFormat('- ', '')}>• List</button>
                                    <button type="button" onClick={() => applyFormat('[text](', ')')}>Link</button>
                                </div>

                                {/* Editor + Preview */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <textarea
                                        id="description-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={10}
                                        className={styles.textarea}
                                        placeholder="Write course description using markdown..."
                                    />

                                    <div className={styles.markdownPreview}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {description || '_Preview will appear here_'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>



                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        placeholder="e.g. Web Development"
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={startTimestamp}
                                        onChange={e => setStartTimestamp(e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={endTimestamp}
                                        onChange={e => setEndTimestamp(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={hasPractical}
                                        onChange={e => setHasPractical(e.target.checked)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Has Practical Session?
                                </label>
                            </div>

                            {/* Basic Verifier Selection (mock UI, real select would be better) */}
                            {verifiers.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label>Assign Verifiers</label>

                                    {/* Select box */}
                                    <div
                                        className={styles.multiSelect}
                                        onClick={() => setShowVerifierDropdown(!showVerifierDropdown)}
                                    >
                                        {selectedVerifiers.length > 0
                                            ? `${selectedVerifiers.length} verifier(s) selected`
                                            : 'Select verifiers'}
                                        <span className={styles.arrow}>▾</span>
                                    </div>

                                    {/* Options dropdown */}
                                    {showVerifierDropdown && (
                                        <div className={styles.optionsBox}>
                                            {verifiers.map((v) => (
                                                <div key={v._id} className={styles.optionItem}>
                                                    <label>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedVerifiers.includes(v._id)}
                                                            onChange={() => {
                                                                if (selectedVerifiers.includes(v._id)) {
                                                                    setSelectedVerifiers(
                                                                        selectedVerifiers.filter(id => id !== v._id)
                                                                    );
                                                                } else {
                                                                    setSelectedVerifiers([...selectedVerifiers, v._id]);
                                                                }
                                                            }}
                                                        />
                                                        {v.name} ({v.email})
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <small className={styles.formHint}>
                                        You can select multiple verifiers
                                    </small>
                                </div>
                            )}




                            <div className={styles.formActions}>
                                <button type="button" onClick={() => router.back()} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.nextButton} disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </PrivateRoute>
    );
}
