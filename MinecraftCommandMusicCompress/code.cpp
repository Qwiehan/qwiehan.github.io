#include <iostream>
#include <fstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
int sensitiveWordAns;
unordered_set<int> sensitiveWordSet= {64,604,731,918,1989,6004,6464,6489,8964};
struct couple {
    string volume,beat;
    couple() {}
    couple(string v,string b) {
        volume=v;
        beat=b;
    }
};
void sensitive(string& str) {
    int beat=stoi(str);
    if(sensitiveWordSet.find(beat)!=sensitiveWordSet.end()) {
        beat--;
        str=to_string(beat);
        sensitiveWordAns++;
    }
}
int main() {
    bool sensitiveWord;
    string Time;
    clog<<"开启敏感词调整(输入1开启，0关闭)：";
    cin>>sensitiveWord;

    clog<<"请输入代表时间的计分板名称：";
    cin>>Time;

    ifstream file("/storage/emulated/0/Download/CppCompiler/output.mcfunction");
    if (!file.is_open()) {
        cerr<<"输入：无法打开文件！"<<endl;
        return 0;
    }

    string line;
    unordered_map<string,unordered_map<string,vector<couple>>> m;
    /*
    execute @e[name=a,scores={time=0}] ~~~ playsound note.pling @a ~~~ 1 3.5636
    */
    //逐行读取直到文件末尾
    while (getline(file, line)) {
        //tt=xxx,
        //tt=xxx}]
        string t_time=Time+'=';
        int beat_pos_begin=line.find(t_time)+t_time.size();
        //int beat_pos_end=line.find("}]")-1;
        int tmp_end1=line.find("}]",beat_pos_begin);
        int tmp_end2=line.find(',',beat_pos_begin);
        int beat_pos_end;
        if(tmp_end2==string::npos||tmp_end2>tmp_end1) {
            //计分板数字后接"}]"
            beat_pos_end=tmp_end1-1;
        }
        else {
            beat_pos_end=tmp_end2-1;
        }

        int beat_len=beat_pos_end-beat_pos_begin+1;
        string beat=line.substr(beat_pos_begin,beat_len);
        if(sensitiveWord)
            sensitive(beat);

        int volume_pos_begin=min(line.find("~~~ ",line.find("playsound")+10)+4,line.find("~~6~ ",line.find("playsound")+10)+5);
        volume_pos_begin=min(volume_pos_begin,line.find("~ ~ ~ ",line.find("playsound")+10)+6);
        //string temp_str=line.substr(pos_temp);
        int pitch_pos_begin=line.find(' ',volume_pos_begin)+1;
        int volume_pos_end=line.find(' ',volume_pos_begin)-1;
        int volume_len=volume_pos_end-volume_pos_begin+1;
        string volume=line.substr(volume_pos_begin,volume_len);
        string pitch=line.substr(pitch_pos_begin);
        if(pitch.find(' ')!=string::npos) {
            //有最小音量，此时字符串为"pitch min_volume"
            //截取0～pos(' ')-1
            pitch=pitch.substr(0,pitch.find(' '));
        }
        int instrument_pos_begin=line.find("playsound")+10;
        int instrument_pos_end=line.find('@',instrument_pos_begin)-2;
        int instrument_len=instrument_pos_end-instrument_pos_begin+1;
        string instrument=line.substr(instrument_pos_begin,instrument_len);

        /*if(m.find(pitch)==m.end()) {
            //该音调先前未录入过
            vector<couple> tmp;
            couple t= {volume,beat};
            tmp.push_back(t);
            m[pitch]=tmp;
        }
        else {
            couple t= {volume,beat};
            m[pitch].push_back(t);
        }*/
        if(m.find(instrument)==m.end()) {
            //该乐器未录入过
            unordered_map<string,vector<couple>> tmp_map;
            vector<couple> tmp_vec;
            couple tmp_couple= {volume,beat};
            tmp_vec.push_back(tmp_couple);
            tmp_map[pitch]=tmp_vec;
            m[instrument]=tmp_map;
        }
        else {
            //乐器录入过
            if(m[instrument].find(pitch)==m[instrument].end()) {
                //该音调先前未录入过
                vector<couple> tmp_vec;
                couple tmp_couple= {volume,beat};
                tmp_vec.push_back(tmp_couple);
                m[instrument][pitch]=tmp_vec;
            }
            else {
                couple tmp_couple= {volume,beat};
                m[instrument][pitch].push_back(tmp_couple);
            }
        }
    }
    file.close();
    ofstream file_out("/storage/emulated/0/Download/Cpp__________/functions/output.mcfunction",ios::out);
    if (!file_out.is_open()) {
        cerr<<"输出：无法打开文件！"<<endl;
        return 0;
    }
    /*for(auto it=m.begin(); it!=m.end(); it++) {
        file_out<<"execute unless entity @a[scores={";
        for(int i=0; i<it->second.size(); i++) {
            file_out<<"time=!"<<it->second[i].beat;
            if(i+1!=it->second.size())
                file_out<<",";
        }
        file_out<<"}] run playsound note.pling @s ~~~ "<<it->second[0].volume<<" "<<it->first<<endl;
    }*/
    for(auto k=m.begin(); k!=m.end(); k++) {
        for(auto it=k->second.begin(); it!=k->second.end(); it++) {
            file_out<<"execute as @a at @s unless entity @s[scores={";
            for(int i=0; i<it->second.size(); i++) {
                file_out<<"time=!"<<it->second[i].beat;
                if(i+1!=it->second.size())
                    file_out<<",";
            }
            file_out<<"}] run playsound "<<k->first<<" @s ~~~ "<<it->second[0].volume<<" "<<it->first<<endl;
        }
    }
    if(sensitiveWord)
        clog<<"共调整"<<sensitiveWordAns<<"次敏感词";
    return 0;
}