using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace JSLess.Models
{
    public class UserProfile
    {
        public string FullName { get; set; }
        public List<string> Industries { get; set; }
        public List<string> Roles { get; set; }
        public Address HomeAddress { get; set; }
    }
    public class Address
    {
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }

    }
}