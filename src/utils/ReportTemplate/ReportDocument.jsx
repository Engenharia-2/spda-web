import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from '@react-pdf/renderer';
import { formatResistance, extractMeasurementDateTime } from '../../utils/dataParsing';

// Register Roboto font to support special characters like Ohm (Ω)
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
    ]
});

const ReportDocument = ({ data, resolvedAttachments, resolvedSignature }) => {
    const measurementDateTime = extractMeasurementDateTime(data.measurements);

    let h2Counter = 0;
    const incrementH2 = () => { h2Counter++; return h2Counter; };

    let h3Counter = 0;
    const incrementH3 = () => { h3Counter++; return `${h2Counter}.${h3Counter}`; };

    // Extract colors from config or use defaults
    const headerBgColor = data.reportConfig?.headerColor || '#ffffff';
    const headerTextColor = data.reportConfig?.headerTextColor || '#333333';
    const secondaryColor = data.reportConfig?.secondaryColor || '#e6e6e6';
    const bodyTextColor = data.reportConfig?.headerTextColor || '#000000'; // Using headerTextColor as general text color if requested, or default black

    // Create dynamic styles based on config
    const styles = StyleSheet.create({
        page: {
            fontFamily: 'Roboto', // Use registered font
            fontSize: 10,
            color: '#000000', // Dynamic body text color
            paddingBottom: 50,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            marginBottom: 20,
            height: 80,
            backgroundColor: headerBgColor, // Dynamic background
        },
        headerLeft: {
            width: '25%',
        },
        headerCenter: {
            width: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            color: headerTextColor,
        },
        headerRight: {
            width: '25%',
        },
        logo: {
            width: 70,
            height: 70,
            objectFit: 'contain',
            marginLeft: 10,

        },
        headerTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: headerTextColor, // Dynamic text color
        },
        section: {
            marginBottom: 10,
            padding: 10,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: secondaryColor, // Dynamic secondary color
            padding: 5,
            marginBottom: 10,
            borderRadius: 3,
            color: headerTextColor, // Dynamic text color
        },
        subSectionTitle: {
            fontSize: 11,
            fontWeight: 'bold',
            color: '#555',
            marginTop: 10,
            marginBottom: 5,
        },
        row: {
            flexDirection: 'row',
            marginBottom: 5,
        },
        column: {
            flex: 1,
            flexDirection: 'column',
        },
        label: {
            fontWeight: 'bold',
        },
        value: {
            marginBottom: 3,
        },
        divider: {
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
            marginVertical: 10,
        },
        table: {
            display: 'table',
            width: 'auto',
            borderStyle: 'solid',
            borderWidth: 1,
            borderRightWidth: 0,
            borderBottomWidth: 0,
            marginTop: 10,
        },
        tableRow: {
            margin: 'auto',
            flexDirection: 'row',

        },
        tableCol: {
            width: '33.33%',
            borderStyle: 'solid',
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            alignItems: 'center',
        },
        tableCell: {
            margin: 'auto',
            marginTop: 5,
            marginBottom: 5,
            fontSize: 9,
        },
        tableHeader: {
            backgroundColor: '#f0f0f0',
            fontWeight: 'bold',
        },
        checklistRow: {
            flexDirection: 'row',
            marginBottom: 3,
        },
        checklistIcon: {
            width: 15,
            textAlign: 'center',
            marginLeft: 5,
        },
        imageGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: 10,
        },
        imageBlock: {
            width: '48%', // 2 columns
            marginBottom: 10,
            alignItems: 'center',
        },
        reportImage: {
            width: '100%',
            height: 200,
            objectFit: 'cover',
            borderRadius: 5,
        },
        imageDescription: {
            fontSize: 9,
            color: '#555',
            marginTop: 5,
            textAlign: 'center',
        },
        signatureBlock: {
            marginTop: 20,
            alignItems: 'flex-start',
        },
        signatureImage: {
            width: 150,
            height: 60,
            objectFit: 'contain',
        },
        footer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 8,
            color: headerTextColor,
            borderTopWidth: 1,
            borderTopColor: '#eee',
            backgroundColor: headerBgColor,
            paddingTop: 10,
            paddingBottom: 10,
        },
    });

    // Header component to be repeated
    const Header = () => (
        <View style={styles.header} fixed>
            <View style={styles.headerLeft}>
                {data.reportConfig?.logo ? (
                    <Image src={data.reportConfig.logo} style={styles.logo} />
                ) : (
                    <Image src="/logoLHF.png" style={styles.logo} />
                )}
            </View>
            <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>
                    {data.reportConfig?.reportTitle || 'Relatório de Inspeção SPDA'}
                </Text>
            </View>
            <View style={styles.headerRight} />
        </View>
    );

    const CheckIcon = () => (
        <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 6L9 17l-5-5" fill="none" />
        </Svg>
    );

    const CrossIcon = () => (
        <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F44336" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 6L6 18M6 6l12 12" fill="none" />
        </Svg>
    );

    const DashIcon = () => (
        <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12h14" fill="none" />
        </Svg>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Header />
                {/* 1. Informações Iniciais */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Informações iniciais:</Text>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Cliente: </Text>{data.client || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Técnico Executor: </Text>{data.engineer || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Prestador: </Text>{data.provider || 'LHF Sistemas'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Representante: </Text>{data.clientRep || 'Não Informado'}</Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Data: </Text>{measurementDateTime.date}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Início: </Text>{measurementDateTime.startTime}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Fim: </Text>{measurementDateTime.endTime}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                </View>

                {/* 2. Dados da Edificação */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Dados da Edificação:</Text>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Tipo: </Text>{data.buildingType || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Endereço: </Text>{data.address || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Info Comp.: </Text>{data.additionalInfo || 'Não Informado'}</Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Altura (m): </Text>{data.height || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Área (m²): </Text>{data.area || 'Não Informado'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                </View>

                {/* 3. Dados do Equipamento */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Dados do Equipamento:</Text>
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Equipamento: </Text>{data.equipmentName || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Nº de Série: </Text>{data.serialNumber || 'Não Informado'}</Text>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.value}><Text style={styles.label}>Calibração: </Text>{data.calibrationDate || 'Não Informado'}</Text>
                            <Text style={styles.value}><Text style={styles.label}>Validade: </Text>{data.calibrationValidity || 'Não Informado'}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                </View>

                {/* 4. Inspeção e Verificação */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Inspeção e Verificação:</Text>

                    <View wrap={false}>
                        <Text style={styles.subSectionTitle}>{incrementH3()} - Checklist de Conformidade:</Text>
                        {Object.entries(data.checklist || {}).map(([key, value]) => {
                            const defaultLabels = {
                                captores: 'Captores',
                                descidas: 'Descidas',
                                aneis: 'Anéis de Cintamento',
                                malha: 'Malha de Aterramento',
                                bep: 'BEP (Barramento)',
                                dps: 'DPS',
                                conexoes: 'Conexões',
                                sinalizacao: 'Sinalização'
                            };

                            const isDefault = Object.prototype.hasOwnProperty.call(defaultLabels, key);
                            const configItem = data.checklistConfig?.find(item => item.id === key);

                            // If NOT default AND NOT in config, it is orphaned -> Skip
                            if (!isDefault && !configItem) {
                                return null;
                            }

                            const label = isDefault ? defaultLabels[key] : configItem?.label;

                            if (!label) return null;

                            const StatusIcon = value.status === 'C' ? CheckIcon : value.status === 'NC' ? CrossIcon : DashIcon;

                            return (
                                <View key={key} style={styles.checklistRow} wrap={false}>
                                    <Text>
                                        <Text style={styles.label}>{label}</Text>
                                        {value.observation ? ` - ${value.observation}` : ''}
                                    </Text>
                                    <View style={styles.checklistIcon}>
                                        <StatusIcon />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.divider} />
                </View>

                {/* 5. Dados de Resistência */}
                <View style={styles.section} break>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Dados de Resistência e Corrente:</Text>
                    {(data.measurements?.parsedData || []).length > 0 ? (
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]} fixed>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>Ponto</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>Resistência(Ω)</Text></View>
                                <View style={styles.tableCol}><Text style={styles.tableCell}>Corrente (A)</Text></View>
                            </View>
                            {data.measurements.parsedData
                                .slice() // Create a shallow copy to avoid modifying the original array
                                .sort((a, b) => (a.ponto || 0) - (b.ponto || 0)) // Sort by 'ponto' property
                                .map((m, index) => (
                                <View key={index} style={styles.tableRow} wrap={false}>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{m.ponto || '-'}</Text></View>
                                    <View style={styles.tableCol}><Text style={styles.tableCell}>{formatResistance(m.resistencia)}</Text></View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {typeof m.corrente === 'number' ? `${m.corrente.toFixed(2)} A` : (m.corrente || '-')}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text>Nenhum dado de resistência coletado.</Text>
                    )}
                </View>

                {/* 6. Conclusão */}
                <View style={styles.section} wrap={false}>
                    <Text style={styles.sectionTitle}>{incrementH2()} - Conclusão:</Text>

                    <View wrap={false}>
                        <Text style={styles.subSectionTitle}>{incrementH3()} - Parecer Técnico:</Text>
                        <Text style={{ textAlign: 'justify', marginBottom: 10 }}>
                            {data.technicalOpinion || 'Não Informado'}
                        </Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.section} wrap={false}>
                        <Text style={styles.subSectionTitle}>{incrementH3()} - Responsável técnico:</Text>
                        <Text>{data.engineer || 'Não Informado'}</Text>
                        {resolvedSignature && (
                            <View style={styles.signatureBlock}>
                                <Image src={resolvedSignature} style={styles.signatureImage} />
                            </View>
                        )}
                    </View>
                </View>

                {/* 7. Anexos */}
                {resolvedAttachments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Anexos:</Text>
                        <View style={styles.imageGrid}>
                            {resolvedAttachments.map((img, index) => (
                                <View key={index} style={styles.imageBlock} wrap={false}>
                                    <Image src={img.url} style={styles.reportImage} />
                                    <Text style={styles.imageDescription}>Figura {index + 1}. {img.description || 'Sem Descrição'}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                <Text
                    style={styles.footer}
                    fixed
                    render={({ pageNumber, totalPages }) =>
                        `Copyright ©2025. Todos direitos reservados à LHF Sistemas de Teste e Medição | Página ${pageNumber} de ${totalPages} `
                    }
                />
            </Page>
        </Document>
    );
};

export default ReportDocument;
