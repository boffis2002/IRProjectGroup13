import requests
from bs4 import BeautifulSoup
import json

def findAll(url):
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        d=soup.find_all('div',class_="w-100 d-flex justify-content-evenly text-center")
        age=d[0].text.strip().split("Age")[1][1:3]
        salary=d[0].text.strip().split("Hourly rate")[1].split(" ")[28][1:]
        ret=""
        ret+=age+"!"+salary
        return ret
    else:
        return ""
    

        
def website1(url):
    results = []
    for i in range(1,50):
        response = requests.get(url+"?page="+str(i))
        print(url+"?page="+str(i))
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            headers = soup.find_all('div', class_='header')
            headers=headers[1:]
            descriptions = soup.find_all('div', class_='description')
            descriptions=descriptions[4:]
            hrefs = soup.find_all('a', class_="stretched-link")

            counter=0
            for header, description, href in zip(headers, descriptions, hrefs):
                all=findAll("https://en.babysits.ch"+href.get('href')),
                age=all[0].split('!')[0]
                salary=all[0].split('!')[1]
                counter+=1
                if counter==16:
                    break
                if header.text.strip()[0:10]=="Babysitter":
                    return results
                result = {
                    "url" : url,
                    "href" : "https://en.babysits.ch"+href.get('href'),
                    "name": header.text.strip().split('\n')[0],
                    "age" : age,
                    "salary" :salary,
                    "description": description.text.strip()
                }
                results.append(result)
        else:
            print(f"Failed to fetch {url}")
            break
    return results


def extract_salary_and_age(header_text):
    salary_start = header_text.find("CHF")
    salary_end = header_text.find("/ ora", salary_start)
    salary = header_text[salary_start:salary_end + 6] if salary_start != -1 and salary_end != -1 else None

    first_age_start = header_text.find("anni")  
    if first_age_start != -1:
        second_age_start = header_text.find("anni", first_age_start + 4)
        if second_age_start != -1:
            age = header_text[max(0, second_age_start - 5):second_age_start].strip()
        else:
            age = None
    else:
        age = None
    return salary, age

def website2(url):
    results = []
    h = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,it;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
    for i in range(1,20):
        response = requests.get(url+"&page="+str(i),headers=h)
        print(url+"&page="+str(i))
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            headers = soup.find_all('div', class_='new-styling flex mb-20 sm-mb-12')
            hrefs = soup.find_all('div', attrs={'data-module': 'UserCard'})
            descriptions = soup.find_all('p')
            counter=0
            for header, description, href in zip(headers, descriptions, hrefs):
                counter+=1
                if counter==11:
                    break

                header_text = header.text.strip()
                salary, age = extract_salary_and_age(header_text)
                if(salary):
                    result = {
                        "url" : url,
                        "href" : "https://babysitting24.ch/it/register/new?registration_referrer=SeeFullProfile&role=consumer&visited_profile="+href.get('id')[5:],
                        "name": header.text.strip().split('\n')[0],
                        "age" : age,
                        "salary" :salary,
                        "description": description.text.strip()
                    }
                    results.append(result)
        else:
            print(f"Failed to fetch {url}")
            break
    return results

def scrape_webpage(url):
    if url=="https://en.babysits.ch/babysitter/lugano/":
        return website1(url)
    if url=="https://babysitting24.ch/it/providers/search?q[place]=Lugano":
        return website2(url)

    

urls = [
    "https://en.babysits.ch/babysitter/lugano/",
    "https://babysitting24.ch/it/providers/search?q[place]=Lugano"
]

scraped_data = []
for url in urls:
    data = scrape_webpage(url)
    if data is not None:
        scraped_data.extend(data)
with open('data_retrieved.json', 'w') as file:
    json.dump(scraped_data, file, indent=4)