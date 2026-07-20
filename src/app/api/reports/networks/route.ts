import { NextRequest, NextResponse } from 'next/server';
import { getSessionPayload } from '@/lib/auth/session';
import { db } from '@/lib/db';

// Simplified UK mobile number prefix → network mapping (first 5 digits of E.164: +447XX)
const UK_NETWORK_MAP: Array<[string, string]> = [
  // EE
  ['07400', 'EE'], ['07401', 'EE'], ['07402', 'EE'], ['07403', 'EE'], ['07404', 'EE'],
  ['07405', 'EE'], ['07406', 'EE'], ['07407', 'EE'], ['07408', 'EE'], ['07409', 'EE'],
  ['07730', 'EE'], ['07731', 'EE'], ['07732', 'EE'], ['07733', 'EE'], ['07734', 'EE'],
  ['07735', 'EE'], ['07736', 'EE'], ['07737', 'EE'], ['07738', 'EE'], ['07739', 'EE'],
  ['07740', 'EE'], ['07741', 'EE'], ['07742', 'EE'], ['07743', 'EE'], ['07744', 'EE'],
  ['07745', 'EE'], ['07746', 'EE'], ['07747', 'EE'], ['07748', 'EE'], ['07749', 'EE'],
  ['07770', 'EE'], ['07771', 'EE'], ['07772', 'EE'], ['07773', 'EE'], ['07774', 'EE'],
  ['07775', 'EE'], ['07776', 'EE'], ['07777', 'EE'], ['07778', 'EE'], ['07779', 'EE'],
  ['07780', 'EE'], ['07781', 'EE'], ['07782', 'EE'], ['07783', 'EE'], ['07784', 'EE'],
  ['07785', 'EE'], ['07786', 'EE'], ['07787', 'EE'], ['07788', 'EE'], ['07789', 'EE'],
  ['07830', 'EE'], ['07831', 'EE'], ['07832', 'EE'], ['07833', 'EE'], ['07834', 'EE'],
  ['07835', 'EE'], ['07836', 'EE'], ['07837', 'EE'], ['07838', 'EE'], ['07839', 'EE'],
  ['07840', 'EE'], ['07841', 'EE'], ['07842', 'EE'], ['07843', 'EE'], ['07844', 'EE'],
  ['07845', 'EE'], ['07846', 'EE'], ['07847', 'EE'], ['07848', 'EE'], ['07849', 'EE'],
  ['07870', 'EE'], ['07871', 'EE'], ['07872', 'EE'], ['07873', 'EE'], ['07874', 'EE'],
  ['07875', 'EE'], ['07876', 'EE'], ['07877', 'EE'], ['07878', 'EE'], ['07879', 'EE'],
  ['07880', 'EE'], ['07881', 'EE'], ['07882', 'EE'], ['07883', 'EE'], ['07884', 'EE'],
  ['07885', 'EE'], ['07886', 'EE'], ['07887', 'EE'], ['07888', 'EE'], ['07889', 'EE'],
  ['07950', 'EE'], ['07951', 'EE'], ['07952', 'EE'], ['07953', 'EE'], ['07954', 'EE'],
  ['07955', 'EE'], ['07956', 'EE'], ['07957', 'EE'], ['07958', 'EE'], ['07959', 'EE'],
  ['07960', 'EE'], ['07961', 'EE'], ['07962', 'EE'], ['07963', 'EE'], ['07964', 'EE'],
  ['07965', 'EE'], ['07966', 'EE'], ['07967', 'EE'], ['07968', 'EE'], ['07969', 'EE'],
  ['07970', 'EE'], ['07971', 'EE'], ['07972', 'EE'], ['07973', 'EE'], ['07974', 'EE'],
  ['07975', 'EE'], ['07976', 'EE'], ['07977', 'EE'], ['07978', 'EE'], ['07979', 'EE'],
  ['07980', 'EE'], ['07981', 'EE'], ['07982', 'EE'], ['07983', 'EE'], ['07984', 'EE'],
  ['07985', 'EE'], ['07986', 'EE'], ['07987', 'EE'], ['07988', 'EE'], ['07989', 'EE'],
  // O2
  ['07700', 'O2'], ['07701', 'O2'], ['07702', 'O2'], ['07703', 'O2'], ['07704', 'O2'],
  ['07705', 'O2'], ['07706', 'O2'], ['07707', 'O2'], ['07708', 'O2'], ['07709', 'O2'],
  ['07714', 'O2'], ['07715', 'O2'], ['07716', 'O2'], ['07717', 'O2'], ['07718', 'O2'],
  ['07719', 'O2'], ['07720', 'O2'], ['07721', 'O2'], ['07722', 'O2'], ['07723', 'O2'],
  ['07724', 'O2'], ['07725', 'O2'], ['07726', 'O2'], ['07727', 'O2'], ['07728', 'O2'],
  ['07729', 'O2'], ['07750', 'O2'], ['07751', 'O2'], ['07752', 'O2'], ['07753', 'O2'],
  ['07754', 'O2'], ['07755', 'O2'], ['07756', 'O2'], ['07757', 'O2'], ['07758', 'O2'],
  ['07759', 'O2'], ['07760', 'O2'], ['07761', 'O2'], ['07762', 'O2'], ['07763', 'O2'],
  ['07764', 'O2'], ['07765', 'O2'], ['07766', 'O2'], ['07767', 'O2'], ['07768', 'O2'],
  ['07769', 'O2'], ['07800', 'O2'], ['07801', 'O2'], ['07802', 'O2'], ['07803', 'O2'],
  ['07804', 'O2'], ['07805', 'O2'], ['07806', 'O2'], ['07807', 'O2'], ['07808', 'O2'],
  ['07809', 'O2'], ['07810', 'O2'], ['07811', 'O2'], ['07812', 'O2'], ['07813', 'O2'],
  ['07814', 'O2'], ['07815', 'O2'], ['07816', 'O2'], ['07817', 'O2'], ['07818', 'O2'],
  ['07819', 'O2'], ['07820', 'O2'], ['07821', 'O2'], ['07822', 'O2'], ['07823', 'O2'],
  ['07824', 'O2'], ['07825', 'O2'], ['07826', 'O2'], ['07827', 'O2'], ['07828', 'O2'],
  ['07829', 'O2'], ['07850', 'O2'], ['07851', 'O2'], ['07852', 'O2'], ['07853', 'O2'],
  ['07854', 'O2'], ['07855', 'O2'], ['07856', 'O2'], ['07857', 'O2'], ['07858', 'O2'],
  ['07859', 'O2'], ['07890', 'O2'], ['07891', 'O2'], ['07892', 'O2'], ['07893', 'O2'],
  ['07894', 'O2'], ['07895', 'O2'], ['07896', 'O2'], ['07897', 'O2'], ['07898', 'O2'],
  ['07899', 'O2'],
  // Vodafone
  ['07590', 'Vodafone'], ['07591', 'Vodafone'], ['07592', 'Vodafone'], ['07593', 'Vodafone'],
  ['07594', 'Vodafone'], ['07595', 'Vodafone'], ['07596', 'Vodafone'], ['07597', 'Vodafone'],
  ['07598', 'Vodafone'], ['07599', 'Vodafone'], ['07600', 'Vodafone'], ['07601', 'Vodafone'],
  ['07602', 'Vodafone'], ['07603', 'Vodafone'], ['07604', 'Vodafone'], ['07605', 'Vodafone'],
  ['07606', 'Vodafone'], ['07607', 'Vodafone'], ['07608', 'Vodafone'], ['07609', 'Vodafone'],
  ['07623', 'Vodafone'], ['07624', 'Vodafone'], ['07625', 'Vodafone'], ['07626', 'Vodafone'],
  ['07627', 'Vodafone'], ['07628', 'Vodafone'], ['07629', 'Vodafone'],
  ['07790', 'Vodafone'], ['07791', 'Vodafone'], ['07792', 'Vodafone'], ['07793', 'Vodafone'],
  ['07794', 'Vodafone'], ['07795', 'Vodafone'], ['07796', 'Vodafone'], ['07797', 'Vodafone'],
  ['07798', 'Vodafone'], ['07799', 'Vodafone'],
  ['07860', 'Vodafone'], ['07861', 'Vodafone'], ['07862', 'Vodafone'], ['07863', 'Vodafone'],
  ['07864', 'Vodafone'], ['07865', 'Vodafone'], ['07866', 'Vodafone'], ['07867', 'Vodafone'],
  ['07868', 'Vodafone'], ['07869', 'Vodafone'],
  ['07900', 'Vodafone'], ['07901', 'Vodafone'], ['07902', 'Vodafone'], ['07903', 'Vodafone'],
  ['07904', 'Vodafone'], ['07905', 'Vodafone'], ['07906', 'Vodafone'], ['07907', 'Vodafone'],
  ['07908', 'Vodafone'], ['07909', 'Vodafone'], ['07910', 'Vodafone'], ['07911', 'Vodafone'],
  ['07912', 'Vodafone'], ['07913', 'Vodafone'], ['07914', 'Vodafone'], ['07915', 'Vodafone'],
  ['07916', 'Vodafone'], ['07917', 'Vodafone'], ['07918', 'Vodafone'], ['07919', 'Vodafone'],
  ['07920', 'Vodafone'], ['07921', 'Vodafone'], ['07922', 'Vodafone'], ['07923', 'Vodafone'],
  ['07924', 'Vodafone'], ['07925', 'Vodafone'], ['07926', 'Vodafone'], ['07927', 'Vodafone'],
  ['07928', 'Vodafone'], ['07929', 'Vodafone'], ['07930', 'Vodafone'], ['07931', 'Vodafone'],
  ['07932', 'Vodafone'], ['07933', 'Vodafone'], ['07934', 'Vodafone'], ['07935', 'Vodafone'],
  ['07936', 'Vodafone'], ['07937', 'Vodafone'], ['07938', 'Vodafone'], ['07939', 'Vodafone'],
  ['07940', 'Vodafone'], ['07941', 'Vodafone'], ['07942', 'Vodafone'], ['07943', 'Vodafone'],
  ['07944', 'Vodafone'], ['07945', 'Vodafone'], ['07946', 'Vodafone'], ['07947', 'Vodafone'],
  ['07948', 'Vodafone'], ['07949', 'Vodafone'],
  // Three
  ['07500', 'Three'], ['07501', 'Three'], ['07502', 'Three'], ['07503', 'Three'],
  ['07504', 'Three'], ['07505', 'Three'], ['07506', 'Three'], ['07507', 'Three'],
  ['07508', 'Three'], ['07509', 'Three'], ['07510', 'Three'], ['07511', 'Three'],
  ['07512', 'Three'], ['07513', 'Three'], ['07514', 'Three'], ['07515', 'Three'],
  ['07516', 'Three'], ['07517', 'Three'], ['07518', 'Three'], ['07519', 'Three'],
  ['07520', 'Three'], ['07521', 'Three'], ['07522', 'Three'], ['07523', 'Three'],
  ['07524', 'Three'], ['07525', 'Three'], ['07526', 'Three'], ['07527', 'Three'],
  ['07528', 'Three'], ['07529', 'Three'], ['07530', 'Three'], ['07531', 'Three'],
  ['07532', 'Three'], ['07533', 'Three'], ['07534', 'Three'], ['07535', 'Three'],
  ['07536', 'Three'], ['07537', 'Three'], ['07538', 'Three'], ['07539', 'Three'],
  ['07540', 'Three'], ['07541', 'Three'], ['07542', 'Three'], ['07543', 'Three'],
  ['07544', 'Three'], ['07545', 'Three'], ['07546', 'Three'], ['07547', 'Three'],
  ['07548', 'Three'], ['07549', 'Three'], ['07550', 'Three'], ['07551', 'Three'],
  ['07552', 'Three'], ['07553', 'Three'], ['07554', 'Three'], ['07555', 'Three'],
  ['07556', 'Three'], ['07557', 'Three'], ['07558', 'Three'], ['07559', 'Three'],
  ['07560', 'Three'], ['07561', 'Three'], ['07562', 'Three'], ['07563', 'Three'],
  ['07564', 'Three'], ['07565', 'Three'], ['07566', 'Three'], ['07567', 'Three'],
  ['07568', 'Three'], ['07569', 'Three'], ['07570', 'Three'], ['07571', 'Three'],
  ['07572', 'Three'], ['07573', 'Three'], ['07574', 'Three'], ['07575', 'Three'],
  ['07576', 'Three'], ['07577', 'Three'], ['07578', 'Three'], ['07579', 'Three'],
  ['07580', 'Three'], ['07581', 'Three'], ['07582', 'Three'], ['07583', 'Three'],
  ['07584', 'Three'], ['07585', 'Three'], ['07586', 'Three'], ['07587', 'Three'],
  ['07588', 'Three'], ['07589', 'Three'],
  ['07990', 'Three'], ['07991', 'Three'], ['07992', 'Three'], ['07993', 'Three'],
  ['07994', 'Three'], ['07995', 'Three'], ['07996', 'Three'], ['07997', 'Three'],
  ['07998', 'Three'], ['07999', 'Three'],
];

// Build lookup map once
const NETWORK_LOOKUP = new Map(UK_NETWORK_MAP);

function getNetwork(rawTo: string): string {
  const to = rawTo.replace(/\s+/g, '');

  // Normalise to 07XXX prefix
  let local: string | null = null;
  if (to.startsWith('+447') && to.length >= 9) {
    local = '07' + to.slice(3, 8);
  } else if (to.startsWith('07') && to.length >= 7) {
    local = to.slice(0, 7);
  }

  if (!local) {
    // Non-UK number — label by country code
    if (to.startsWith('+1')) return 'US / Canada';
    if (to.startsWith('+61')) return 'Australia';
    if (to.startsWith('+353')) return 'Ireland';
    if (to.startsWith('+')) return 'International';
    return 'Unknown';
  }

  const prefix = local.slice(0, 5);
  return NETWORK_LOOKUP.get(prefix) ?? 'Other UK';
}

export async function GET(req: NextRequest) {
  const session = await getSessionPayload();
  if (!session?.userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30', 10), 1), 730);
  const campaignId = searchParams.get('campaignId') ?? undefined;

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const messages = await db.message.findMany({
    where: {
      organisationId: session.orgId,
      direction: 'outbound',
      createdAt: { gte: since },
      ...(campaignId ? { campaignId } : {}),
    },
    select: { to: true },
  });

  const networkCounts: Record<string, number> = {};
  for (const msg of messages) {
    const net = getNetwork(msg.to);
    networkCounts[net] = (networkCounts[net] ?? 0) + 1;
  }

  const result = Object.entries(networkCounts)
    .map(([network, count]) => ({ network, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(result);
}
