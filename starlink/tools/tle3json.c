
/* 
Takes a 2LE format TLE file and converts to a basic JSON file
that can be more easily consumed by Javascript.
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static void remove_eol(char *in)
{
	char *c = in;
	while(*c != '\0') {
		if(*c == '\r') *c = '\0';
		if(*c == '\n') *c = '\0';
		c++;
	}
}

int main (int argc, char *argv[])
{
	int print_comma = 0;
	char line0[120];
	char line1[120], line2[120];
	FILE *out, *in;
	
	if (argc < 3) {
		printf("usage: %s <input_file> <output_file>\n", argv[0]);
		exit(-1);
	}
	
	in = fopen(argv[1], "r");
	if(!in) {
		printf("Failed to open %s for input\n", argv[1]);
		exit(-1);
	}
	out = fopen(argv[2], "w");
	if(!out) {
		if(in) fclose(in);
		printf("Failed to open %s for output\n", argv[2]);
		exit(-2);
	}
	
	fprintf(out, "[\r\n");
	
	while(!feof(in)) {
		int have1and2 = 0;
		memset(line0, 0, 120);
		memset(line1, 0, 120);
		memset(line2, 0, 120);
		fgets(line0, 119, in);
		remove_eol(line0);
		fgets(line1, 119, in);
		remove_eol(line1);
		fgets(line2, 119, in);
		remove_eol(line2);
		if(strlen(line1) > 0 && strlen(line2) > 0) {
			if(line1[0] == '1' && line2[0] == '2') {
				have1and2 = 1;
			}
			if(have1and2) {
				if(print_comma > 0) fprintf(out, ",\r\n");
				else fprintf(out, "\r\n");
				fprintf(out, "\t{\r\n");
				//fprintf(out, "\t\"SOURCE\": \"all.json\",\r\n"); 
				fprintf(out, "\t\"TLE_LINE0\": \"%s\",\r\n", line0); 
				fprintf(out, "\t\"TLE_LINE1\": \"%s\",\r\n", line1); 
				fprintf(out, "\t\"TLE_LINE2\": \"%s\"\r\n", line2); 
				fprintf(out, "\t}");
				print_comma++;
			}
		}
	}
	
	fprintf(out, "\r\n]\r\n");
	
	fclose(in);
	fclose(out);
	
	return 0;
}
