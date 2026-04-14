using API.DTOs;
using API.Entities;
using API.Enums;
using AutoMapper;
using AutoMapper.QueryableExtensions;

namespace API.RequestHelpers;

public class MappingProfiles : Profile
{
    // _mapper.Map<SessionDto>(session, opt => opt.Items["LinkToken"] = token); accepts a third parameter of type Action<IMappingOperationOptions<TSource, TDestination>>? opts
    // https://docs.automapper.org/en/stable/Custom-value-resolvers.html#passing-parameters-to-custom-resolvers

    public MappingProfiles()
    {

        CreateMap<Session, SessionDto>()
        .ForMember(d => d.SessionId, o => o.MapFrom(s => s.Id.ToString()))
        .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host.FirstName + " " + s.Host.LastName))
        .ForMember(d => d.AttendeesCount, o => o.MapFrom(s => s.Attendees.Count))
        .ForMember(d => d.Status, o => o.MapFrom(s => s.SessionExpiresAt > DateTime.UtcNow ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString()))
        .ForMember(d => d.SessionExpiresAt, o => o.MapFrom(s => s.SessionExpiresAt))
        .ForMember(d => d.ClassId, o => o.MapFrom(s => s.ClassId.HasValue ? s.ClassId.Value.ToString() : null))
        .ForMember(d => d.ClassName, o => o.MapFrom(s => s.Class != null ? s.Class.Name : null))
        .ForMember(d => d.LinkToken, o => o.MapFrom((s, d, _, ctx) => ctx.Items.ContainsKey("LinkToken") ? ctx.Items["LinkToken"] : null)); // https://docs.automapper.org/en/stable/Custom-value-resolvers.html#passing-parameters-to-custom-resolvers
        // .ForMember(d => d.LinkToken, o => o.MapFrom((s, d, _, ctx) => ctx.Items["LinkToken"]));

        CreateMap<Session, SessionsDto>()
        .ForMember(d => d.SessionId, o => o.MapFrom(s => s.Id.ToString()))
        .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host.FirstName + " " + s.Host.LastName))
        .ForMember(d => d.AttendeesCount, o => o.MapFrom(s => s.AttendeesCount))
        .ForMember(d => d.Status, o => o.MapFrom(s => s.Status))
        .ForMember(d => d.SessionExpiresAt, o => o.MapFrom(s => s.SessionExpiresAt))
        .ForMember(d => d.ClassId, o => o.MapFrom(s => s.ClassId.HasValue ? s.ClassId.Value.ToString() : null))
        .ForMember(d => d.ClassName, o => o.MapFrom(s => s.Class != null ? s.Class.Name : null));

        CreateMap<Session, SessionAttendeesDto>()
        .ForMember(d => d.SessionId, o => o.MapFrom(s => s.Id.ToString()))
        .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host.FirstName + " " + s.Host.LastName))
        .ForMember(d => d.AttendeesCount, o => o.MapFrom(s => s.Attendees.Count))
        .ForMember(d => d.Status, o => o.MapFrom(s => s.SessionExpiresAt > DateTime.UtcNow ? SessionStatus.Active.ToString() : SessionStatus.Expired.ToString()))
        .ForMember(d => d.SessionExpiresAt, o => o.MapFrom(s => s.SessionExpiresAt));
        // .ForMember(d => d.Attendees, o => o.MapFrom(s => s.Attendees.AsQueryable().ProjectTo<AttendeeDto>(_mapper.ConfigurationProvider)));

        CreateMap<Class, ClassDto>()
        .ForMember(d => d.ClassId, o => o.MapFrom(s => s.Id.ToString()))
        .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host.FirstName + " " + s.Host.LastName))
        .ForMember(d => d.SessionsCount, o => o.MapFrom(s => s.Sessions.Count));

        CreateMap<Class, ClassesDto>()
        .ForMember(d => d.ClassId, o => o.MapFrom(s => s.Id.ToString()))
        .ForMember(d => d.HostName, o => o.MapFrom(s => s.Host.FirstName + " " + s.Host.LastName))
        .ForMember(d => d.SessionsCount, o => o.MapFrom(s => s.Sessions.Count));

        CreateMap<AppUser, UserDto>()
        .ForMember(d => d.DisplayName, o => o.MapFrom(s => s.FirstName + " " + s.LastName))
        .ForMember(d => d.Token, o => o.MapFrom((s, d, _, ctx) => ctx.Items["AppUserToken"]));

        CreateMap<Attendee, AttendeeDto>()
        .ForMember(d => d.Id, o => o.MapFrom(s => s.Id))
        .ForMember(d => d.FirstName, o => o.MapFrom(s => s.FirstName))
        .ForMember(d => d.LastName, o => o.MapFrom(s => s.LastName))
        .ForMember(d => d.Email, o => o.MapFrom(s => s.Email))
        .ForMember(d => d.MATNumber, o => o.MapFrom(s => s.MATNumber))
        .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.CreatedAt));

        CreateMap<AttendeeDto, Attendee>()
        .ForMember(d => d.Id, o => o.MapFrom(s => s.Id))
        .ForMember(d => d.FirstName, o => o.MapFrom(s => s.FirstName))
        .ForMember(d => d.LastName, o => o.MapFrom(s => s.LastName))
        .ForMember(d => d.Email, o => o.MapFrom(s => s.Email))
        .ForMember(d => d.MATNumber, o => o.MapFrom(s => s.MATNumber))
        .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.CreatedAt));

    }
}
