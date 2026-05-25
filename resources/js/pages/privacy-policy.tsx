import { Head, Link } from '@inertiajs/react';

import { LegalDocumentLayout } from '@/layouts/legal-document-layout';
import { login, register } from '@/routes';

type PrivacyPolicyPageProps = {
    title: string;
    contentHtml: string;
    lastUpdated: string;
};

export default function PrivacyPolicy({ title, contentHtml, lastUpdated }: PrivacyPolicyPageProps) {
    return (
        <>
            <Head title={title} />
            <LegalDocumentLayout
                title={title}
                lastUpdated={lastUpdated}
                footer={
                    <p className="text-center text-sm text-gray-600">
                        <Link
                            href={register.url()}
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Terug naar registreren
                        </Link>
                        <span className="mx-2 text-gray-400" aria-hidden>
                            ·
                        </span>
                        <Link
                            href={login.url()}
                            className="font-medium text-red-600 hover:text-red-700"
                        >
                            Inloggen
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
