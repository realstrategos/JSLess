using JSLess.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace JSLess.Controllers
{
    public class SampleController : Controller
    {
        public ActionResult Index()
        {
            return View("Index");
        }

        public ActionResult ComplexPage()
        {
            return View("ComplexPage");
        }
        public ActionResult PrimaryCall(int counter)
        {
            counter += 1;
            ViewBag.counter = counter;
            return PartialView("NestedContent");
        }

        public ActionResult NestedContent(int counter)
        {
            counter += 1;
            ViewBag.counter = counter;
            return PartialView("NestedContent");
        }
        public ActionResult SelectorTesting()
        {
            return View("SelectorTesting");
        }

        public ActionResult SimplePartial()
        {
            ViewBag.time = DateTime.Now.ToString();
            return PartialView("SimplePartial");
        }

        [AcceptVerbs(HttpVerbs.Get | HttpVerbs.Post)]
        public ActionResult UserProfile(UserProfile model)
        {
            List<string> industryList = (from i in Enumerable.Range(1, 8) select "Industry-" + i.ToString()).ToList();
            List<string> rolesList = (from i in Enumerable.Range(1, 8) select "Role-" + i.ToString()).ToList();
            Dictionary<string, Guid> itemList = new Dictionary<string, Guid>();

            industryList.Insert(0, "Medical");
            industryList.Insert(0, "Finance");
            industryList.Insert(0, "Technology");

            for (int i = 0; i < 20; i++)
            {
                itemList.Add("Item-" + i.ToString(), Guid.NewGuid());
            }

            ViewBag.IndustryList = industryList;
            ViewBag.RolesList = rolesList;
            ViewBag.ItemList = itemList;

            if (Request.HttpMethod == "POST" && Request["impersonateGET"] == null)
            {
            }
            else
            {
                model = new UserProfile
                {
                    FullName = "John Doe",
                    Industries = new List<string>(new string[] { "Medical", "Finance", "Technology" }),
                    Roles = new List<string>(new string[] { "Role-1", "Role-2" }),
                    HomeAddress = new Address
                    {
                        Address1 = "123 main stz",
                        City = "Medina",
                        State = "OH",
                        PostalCode = "44221"
                    },
                };
            }
            return PartialView("_userProfile", model);
        }
    }
}
