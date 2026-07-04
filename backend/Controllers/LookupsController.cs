using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SecureWatch.Api.Services;

namespace SecureWatch.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Analyst")]
public sealed class LookupsController(IIpReputationService ipReputationService, ICveLookupService cveLookupService) : ControllerBase
{
    [HttpGet("ip/{ipAddress}")]
    public async Task<IActionResult> CheckIp(string ipAddress, CancellationToken cancellationToken) =>
        Ok(await ipReputationService.CheckAsync(ipAddress, cancellationToken));

    [HttpGet("cve")]
    public async Task<IActionResult> SearchCves([FromQuery] string query, CancellationToken cancellationToken) =>
        Ok(await cveLookupService.SearchAsync(query, cancellationToken));
}
