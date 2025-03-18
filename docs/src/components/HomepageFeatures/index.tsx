import React from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import { Book, Calendar, Clipboard, Cloud, Database, LineChart, Map, Shield, Smartphone } from 'lucide-react';
import styles from './styles.module.css';

const FeatureList = [
    {
        title: 'Mobile-First Design',
        icon: <Smartphone size={32} />,
        description: (
            <>
                Take your beekeeping records to the field with our responsive mobile interface.
                Designed for field use on your smartphone or tablet.
            </>
        ),
        status: 'core',
    },
    {
        title: 'Apiary Management',
        icon: <Map size={32} />,
        description: (
            <>
                Manage your apiaries with location tracking and organization.
                Keep all your hive locations organized in one place.
            </>
        ),
        status: 'core',
    },
    {
        title: 'Hive Tracking',
        icon: <Database size={32} />,
        description: (
            <>
                Monitor individual hives, their status, and configuration.
                Track equipment and maintain complete colony records.
            </>
        ),
        status: 'core',
    },
    {
        title: 'Inspection Forms',
        icon: <Clipboard size={32} />,
        description: (
            <>
                Record observations with streamlined inspection forms.
                Quick toggles and rating scales for efficient data entry.
            </>
        ),
        status: 'in-progress',
    },
    {
        title: 'Queen Management',
        icon: <Shield size={32} />,
        description: (
            <>
                Track queen details, marking colors, and replacement history.
                Document queen performance and lineage over time.
            </>
        ),
        status: 'in-progress',
    },
    {
        title: 'Weather Integration',
        icon: <Cloud size={32} />,
        description: (
            <>
                Record weather conditions during inspections.
                Track environmental factors alongside colony observations.
            </>
        ),
        status: 'planned',
    },
    {
        title: 'Treatment Tracking',
        icon: <Calendar size={32} />,
        description: (
            <>
                Log treatments with dates and methods.
                Keep records of all medications and interventions.
            </>
        ),
        status: 'in-progress',
    },
    {
        title: 'Performance Insights',
        icon: <LineChart size={32} />,
        description: (
            <>
                View colony strength and production trends over time.
                Use data to optimize your beekeeping practices.
            </>
        ),
        status: 'planned',
    },
    {
        title: 'Self-Hosted',
        icon: <Book size={32} />,
        description: (
            <>
                Run Hive-Pal on your own server or local network.
                Keep complete control of your beekeeping data.
            </>
        ),
        status: 'core',
    },
];

function Feature({title, icon, description, status}) {
    return (
        <div className={clsx('col col--4', styles.featureCard)}>
            <div className={styles.featureContent}>
                <div className={styles.featureIcon}>
                    {icon}
                </div>
                <div className={styles.featureDetails}>
                    <div className={styles.featureHeader}>
                        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
                        {status !== 'core' && (
                            <span className={clsx(styles.featureStatus, {
                                [styles.statusInProgress]: status === 'in-progress',
                                [styles.statusPlanned]: status === 'planned',
                            })}>
                {status === 'in-progress' ? 'In Progress' : 'Planned'}
              </span>
                        )}
                    </div>
                    <p className={styles.featureDescription}>{description}</p>
                </div>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <div className={styles.featuresContainer}>
            <div className="row">
                {FeatureList.map((props, idx) => (
                    <Feature {...props} />
                ))}
            </div>
        </div>
    );
}