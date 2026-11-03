import { getTenantActivity } from '../services/activity.service.js'

export async function getActivity(req, res, next) {
  try {
    const { limit = 50, entityId } = req.query
    const logs = await getTenantActivity(
      req.tenantId,
      req.organizationId,
      { limit: parseInt(limit, 10), entityId: entityId || null },
    )
    return res.status(200).json({ success: true, data: { logs } })
  } catch (err) { next(err) }
}
