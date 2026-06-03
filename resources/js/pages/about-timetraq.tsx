import { Head, Link } from '@inertiajs/react';

import { LegalDocumentLayout } from '@/layouts/legal-document-layout';
import { login, privacy, register } from '@/routes';

type AboutTimeTraqPageProps = {
    title: string;
    contentHtml: string;
    lastUpdated: string | null;
};

export default function AboutTimeTraq({ title, contentHtml, lastUpdated }: AboutTimeTraqPageProps) {
    return (
        <>
            <Head title={title} />
            <LegalDocumentLayout
                title={title}
                lastUpdated={lastUpdated}
                footer={
                    <p className="text-center text-sm text-gray-600">
                        <Link
                            href={login.url()}
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Inloggen
                        </Link>
                        <span className="mx-2 text-gray-400" aria-hidden>
                            ·
                        </span>
                        <Link
                            href={register.url()}
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Account aanmaken
                        </Link>
                        <span className="mx-2 text-gray-400" aria-hidden>
                            ·
                        </span>
                        <Link
                            href={privacy.url()}
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Privacybeleid
                        </Link>
                    </p>
                }
            >
                <article
                    className="legal-content"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
            </LegalDocumentLayout>
        </>
    );
}
